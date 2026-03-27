import { Helmet } from 'react-helmet-async'
import { Card, Typography } from 'antd'

const SITE_URL = 'https://yiqishuyuan.online'

export default function AboutPage() {
  return (
    <div className="tool-page-shell">
      <Helmet>
        <title>About | 在线工具实验室</title>
        <meta
          name="description"
          content="了解在线工具实验室的定位与目标：提供简洁、稳定、易用的在线工具服务。"
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
      </Helmet>

      <Card className="tool-panel">
        <Typography.Title level={2}>About（关于我们）</Typography.Title>
        <Typography.Paragraph>
          在线工具实验室致力于提供实用、快速、稳定的工具能力，帮助你在开发、学习和日常办公中节省时间。
        </Typography.Paragraph>
        <Typography.Paragraph>
          我们持续优化工具体验，尽量做到打开即用、结果清晰，并不断扩展高频工具覆盖。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
