import { Helmet } from 'react-helmet-async'
import { Card, Typography } from 'antd'

const SITE_URL = 'https://yiqishuyuan.online'

export default function TermsOfServicePage() {
  return (
    <div className="tool-page-shell">
      <Helmet>
        <title>Terms of Service | 在线工具实验室</title>
        <meta
          name="description"
          content="在线工具实验室服务条款：说明服务范围、用户责任、免责声明与条款更新机制。"
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/terms`} />
      </Helmet>

      <Card className="tool-panel">
        <Typography.Title level={2}>Terms of Service（服务条款）</Typography.Title>
        <Typography.Paragraph>
          本站提供在线工具服务，供个人或组织在合法合规的前提下使用。你在使用本站服务时，应遵守适用法律法规，不得用于违法或侵权行为。
        </Typography.Paragraph>
        <Typography.Paragraph>
          本站会持续优化服务，但不对服务连续可用性、特定适用性或绝对无误作出保证。你应自行评估工具输出结果并承担使用后果。
        </Typography.Paragraph>
        <Typography.Paragraph>
          本站可根据运营需要更新本条款。条款更新后继续使用本站，视为你已阅读并同意更新后的内容。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
