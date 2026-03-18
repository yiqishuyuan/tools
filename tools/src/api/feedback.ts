import request from '../utils/request/request'

export type FeedbackType = 'suggestion' | 'error'

type CaptchaResponse = {
  ok: boolean
  message?: string
  captchaId: string
  svg: string
  expiresInMs: number
}

type FeedbackSubmitResponse = {
  ok: boolean
  message?: string
}

export async function fetchFeedbackCaptcha() {
  const response = await request.get<CaptchaResponse>('/api/feedback/captcha')
  if (!response.data.ok) {
    throw new Error(response.data.message || '获取验证码失败')
  }
  return response.data
}

export async function submitFeedback(payload: {
  type: FeedbackType
  content: string
  email: string
  captchaId: string
  captchaCode: string
}) {
  const response = await request.post<FeedbackSubmitResponse>(
    '/api/feedback/report',
    payload,
  )
  if (!response.data.ok) {
    throw new Error(response.data.message || '提交失败')
  }
  return response.data
}
