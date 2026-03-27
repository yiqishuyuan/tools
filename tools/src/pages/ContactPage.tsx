import { Helmet } from 'react-helmet-async'
import { Card, Typography } from 'antd'

const SITE_URL = 'https://yiqishuyuan.online'
const SUPPORT_EMAIL = 'yiqishuyuan@gmail.com'

export default function ContactPage() {
  return (
    <div className="tool-page-shell">
      <Helmet>
        <title>Contact | 在线工具实验室</title>
        <meta
          name="description"
          content="联系在线工具实验室：客服邮箱与站内反馈双通道，支持问题咨询、建议反馈与合作沟通。"
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
      </Helmet>

      <Card className="tool-panel">
        <Typography.Title level={2}>Contact（联系方式）</Typography.Title>
        <Typography.Paragraph>
          客服邮箱：<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </Typography.Paragraph>
        <Typography.Paragraph>
          你也可以使用页面下方反馈中心提交建议或问题。为了更快定位错误问题，我们会抓取当前网站路由，抓取不涉及隐私信息，仅用于问题排查。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
