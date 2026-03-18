import { Router, type Request, type Response, type NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import svgCaptcha from 'svg-captcha'

import { toolCatalog } from '../data/toolCatalog.js'
import {
  executeTool,
  listImplementedToolIds,
} from '../services/toolService.js'

type FeedbackType = 'suggestion' | 'error'

type CaptchaSession = {
  text: string
  expiresAt: number
}

const CAPTCHA_TTL_MS = 5 * 60 * 1000
const RATE_LIMIT_MS = 60 * 1000
const captchaStore = new Map<string, CaptchaSession>()
const sendThrottleByIp = new Map<string, number>()

function cleanupCaptchaStore() {
  const now = Date.now()
  for (const [id, session] of captchaStore.entries()) {
    if (session.expiresAt <= now) {
      captchaStore.delete(id)
    }
  }
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers['x-forwarded-for']
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || '')
        .split(',')[0]
        .trim()
  return firstForwardedIp || req.ip || 'unknown'
}

function createMailTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure =
    String(process.env.SMTP_SECURE || (port === 465 ? 'true' : 'false')).toLowerCase() === 'true'

  if (!host || !user || !pass) {
    throw new Error('邮件服务未配置，请设置 SMTP_HOST、SMTP_USER、SMTP_PASS')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

async function sendFeedbackMail(params: {
  type: FeedbackType
  content: string
  reporterEmail: string
  ip: string
}) {
  const receiver = process.env.FEEDBACK_TO_EMAIL || process.env.SMTP_USER
  const sender = process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER
  if (!receiver || !sender) {
    throw new Error('收件邮箱未配置，请设置 FEEDBACK_TO_EMAIL 或 SMTP_USER')
  }

  const transporter = createMailTransporter()
  const titlePrefix = params.type === 'error' ? '错误报告' : '建议反馈'
  const subject = `[网站${titlePrefix}] ${new Date().toLocaleString('zh-CN', { hour12: false })}`
  const text = [
    `类型: ${titlePrefix}`,
    `用户邮箱: ${params.reporterEmail}`,
    `来源 IP: ${params.ip}`,
    `提交时间: ${new Date().toISOString()}`,
    '',
    '内容:',
    params.content,
  ].join('\n')

  await transporter.sendMail({
    from: sender,
    to: receiver,
    replyTo: params.reporterEmail,
    subject,
    text,
  })
}

const router = Router()

router.get('/catalog', (_req: Request, res: Response) => {
  const implemented = new Set(listImplementedToolIds())

  res.json({
    ok: true,
    categories: toolCatalog.map((category) => ({
      ...category,
      tools: category.tools.map((tool) => ({
        ...tool,
        implemented: implemented.has(tool.id),
      })),
    })),
  })
})

router.get('/feedback/captcha', (_req: Request, res: Response) => {
  cleanupCaptchaStore()
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    width: 120,
    height: 44,
    color: true,
    ignoreChars: '0o1ilI',
  })
  const captchaId = randomUUID()
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  })

  res.json({
    ok: true,
    captchaId,
    svg: captcha.data,
    expiresInMs: CAPTCHA_TTL_MS,
  })
})

router.post('/feedback/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    cleanupCaptchaStore()
    const ip = getClientIp(req)
    const now = Date.now()
    const lastSentAt = sendThrottleByIp.get(ip) || 0
    if (now - lastSentAt < RATE_LIMIT_MS) {
      return res.status(429).json({
        ok: false,
        message: '提交过于频繁，请稍后再试',
      })
    }

    const { type, content, email, captchaId, captchaCode } = (req.body ?? {}) as {
      type?: FeedbackType
      content?: string
      email?: string
      captchaId?: string
      captchaCode?: string
    }

    if (type !== 'suggestion' && type !== 'error') {
      return res.status(400).json({ ok: false, message: 'type 必须是 suggestion 或 error' })
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ ok: false, message: '反馈内容不能为空' })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ ok: false, message: '请输入有效邮箱地址' })
    }
    if (!captchaId || !captchaCode) {
      return res.status(400).json({ ok: false, message: '请输入验证码' })
    }

    const captchaSession = captchaStore.get(captchaId)
    captchaStore.delete(captchaId)
    if (!captchaSession || captchaSession.expiresAt < now) {
      return res.status(400).json({ ok: false, message: '验证码已过期，请刷新后重试' })
    }
    if (captchaSession.text !== String(captchaCode).trim().toLowerCase()) {
      return res.status(400).json({ ok: false, message: '验证码错误' })
    }

    await sendFeedbackMail({
      type,
      content: content.trim(),
      reporterEmail: email.trim(),
      ip,
    })
    sendThrottleByIp.set(ip, now)

    res.json({
      ok: true,
      message: '提交成功，已发送邮件通知',
    })
  } catch (error) {
    next(error)
  }
})

router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toolId, input = '', options = {} } = (req.body ?? {}) as {
      toolId?: string
      input?: string
      options?: Record<string, unknown>
    }

    if (!toolId) {
      return res.status(400).json({
        ok: false,
        message: 'toolId is required.',
      })
    }

    const data = await executeTool(toolId, input, options)

    res.json({
      ok: true,
      ...data,
    })
  } catch (error) {
    next(error)
  }
})

export default router
