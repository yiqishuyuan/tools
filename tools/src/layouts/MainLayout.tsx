import {
  BulbOutlined,
  HomeOutlined,
  MessageOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Button, Input, Layout, Select, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  fetchFeedbackCaptcha,
  submitFeedback,
  type FeedbackType,
} from '../api/feedback'
import { useThemeMode } from '../context/ThemeModeContext'
import { allTools, toolCategories } from '../utils/toolCatalog'

const { Header, Content } = Layout
const { TextArea } = Input
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggleTheme } = useThemeMode()
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingCaptcha, setLoadingCaptcha] = useState(false)
  const [submitCooldown, setSubmitCooldown] = useState(0)
  const currentTool = allTools.find((tool) => tool.path === location.pathname)
  const currentCategory = currentTool
    ? toolCategories.find((category) => category.key === currentTool.categoryKey)
    : undefined
  const currentCategoryOptions =
    currentCategory?.tools.map((tool) => ({
      value: tool.path,
      label: tool.name,
    })) ?? []

  const loadCaptcha = async () => {
    setLoadingCaptcha(true)
    try {
      const data = await fetchFeedbackCaptcha()
      setCaptchaId(data.captchaId)
      setCaptchaSvg(data.svg)
      setCaptchaCode('')
    } catch (error) {
      message.error((error as Error).message || '验证码加载失败')
    } finally {
      setLoadingCaptcha(false)
    }
  }

  useEffect(() => {
    void loadCaptcha()
  }, [])

  useEffect(() => {
    if (submitCooldown <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      setSubmitCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [submitCooldown])

  const handleSubmitFeedback = async () => {
    const content = feedbackContent.trim()
    const email = feedbackEmail.trim()
    if (!content) {
      message.warning('请填写反馈内容')
      return
    }
    if (!email) {
      message.warning('请填写邮箱地址')
      return
    }
    if (!emailPattern.test(email)) {
      message.warning('请输入正确的邮箱地址')
      return
    }
    if (!captchaCode.trim() || !captchaId) {
      message.warning('请填写验证码')
      return
    }
    if (submitCooldown > 0) {
      message.warning(`请在 ${submitCooldown} 秒后再提交`)
      return
    }

    setSubmitting(true)
    try {
      await submitFeedback({
        type: feedbackType,
        content,
        email,
        captchaId,
        captchaCode: captchaCode.trim(),
      })
      message.success('反馈已提交，感谢你的建议和反馈，我们将尽快通过邮箱反馈给你！')
      setFeedbackContent('')
      setCaptchaCode('')
      setSubmitCooldown(30)
      await loadCaptcha()
    } catch (error) {
      message.error((error as Error).message || '提交失败')
      await loadCaptcha()
    } finally {
      setSubmitting(false)
    }
  }

  const captchaImage = captchaSvg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg)}`
    : ''

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-header__brand" onClick={() => navigate('/')}>
          <Typography.Text className="app-header__eyebrow">
            TOOLS
          </Typography.Text>
          <Typography.Title level={4} className="app-header__title">
            在线工具实验室
          </Typography.Title>
          <Typography.Text className="app-header__subtitle">
            不只是能用，而是更快找到、更顺手处理、更清晰得到结果
          </Typography.Text>
        </div>

        <Space wrap className="app-header__actions">
          {currentTool && currentCategoryOptions.length > 0 && (
            <Select
              className="app-header__tool-select"
              value={currentTool.path}
              options={currentCategoryOptions}
              onChange={(path) => navigate(path)}
            />
          )}
          <Button className="app-header__button" icon={<HomeOutlined />} onClick={() => navigate('/')}>
            首页
          </Button>
          <Button className="app-header__button app-header__button--accent" icon={<BulbOutlined />} onClick={toggleTheme}>
            {isDark ? '浅色模式' : '深色模式'}
          </Button>
        </Space>
      </Header>

      <Content className="app-content">
        <div className="app-content__inner">
          <Outlet />
          <div className="app-feedback">
            <Typography.Title level={5} className="app-feedback__title">
              反馈中心
            </Typography.Title>
            <Typography.Text className="app-feedback__desc">
              可提交建议或错误报告，我们会通过邮件及时查看
            </Typography.Text>
            <div className="app-feedback__type-actions">
              <Button
                type={feedbackType === 'suggestion' ? 'primary' : 'default'}
                icon={<MessageOutlined />}
                onClick={() => setFeedbackType('suggestion')}
              >
                建议
              </Button>
              <Button
                type={feedbackType === 'error' ? 'primary' : 'default'}
                danger={feedbackType === 'error'}
                icon={<WarningOutlined />}
                onClick={() => setFeedbackType('error')}
              >
                错误报告
              </Button>
            </div>
            <TextArea
              className="app-feedback__content"
              value={feedbackContent}
              rows={4}
              maxLength={1000}
              showCount
              onChange={(event) => setFeedbackContent(event.target.value)}
              placeholder="请输入详细内容，便于快速定位和处理"
            />
            <Input
              type="email"
              className="app-feedback__email"
              value={feedbackEmail}
              onChange={(event) => setFeedbackEmail(event.target.value)}
              placeholder="请输入你的邮箱（用于回执）"
            />
            <div className="app-feedback__captcha-row">
              <Input
                value={captchaCode}
                onChange={(event) => setCaptchaCode(event.target.value)}
                placeholder="请输入验证码"
              />
              <div className="app-feedback__captcha-image-wrap">
                {captchaImage ? (
                  <img src={captchaImage} alt="验证码" className="app-feedback__captcha-image" />
                ) : (
                  <span className="app-feedback__captcha-placeholder">加载中</span>
                )}
              </div>
              <Button icon={<ReloadOutlined />} onClick={() => void loadCaptcha()} loading={loadingCaptcha}>
                刷新
              </Button>
            </div>
            <Button
              type="primary"
              className="app-feedback__submit"
              loading={submitting}
              disabled={submitCooldown > 0}
              onClick={() => void handleSubmitFeedback()}
            >
              {submitCooldown > 0 ? `${submitCooldown}s 后可提交` : '提交反馈'}
            </Button>
          </div>
          <div className="app-site-footer">
            <Typography.Text>
              @copy {new Date().getFullYear()} lily-工具实验室 · 保留所有权利
            </Typography.Text>
          </div>
        </div>
      </Content>
    </Layout>
  )
}
