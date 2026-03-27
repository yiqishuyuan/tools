import { Helmet } from 'react-helmet-async'
import { Card, Typography } from 'antd'

const SITE_URL = 'https://yiqishuyuan.online'

export default function PrivacyPolicyPage() {
  return (
    <div className="tool-page-shell">
      <Helmet>
        <title>Privacy Policy | 在线工具实验室</title>
        <meta
          name="description"
          content="在线工具实验室隐私政策：说明数据收集范围、用途、保留期限、用户权利与 AdSense Cookie 使用方式。"
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/privacy-policy`} />
      </Helmet>

      <Card className="tool-panel">
        <Typography.Title level={2}>Privacy Policy（隐私政策）</Typography.Title>
        <Typography.Paragraph>
          我们仅在你主动提交反馈时收集必要信息（如反馈内容、邮箱、验证码相关字段），用于问题处理与沟通回复。
        </Typography.Paragraph>
        <Typography.Paragraph>
          我们不会将你的信息用于与服务无关的目的，也不会在未授权情况下对外共享你的个人信息。
        </Typography.Paragraph>
        <Typography.Paragraph>
          本站可能使用第三方广告服务（如 Google AdSense）。第三方供应商可能使用 Cookie
          来根据你此前访问本站或其他网站的行为展示个性化广告。
        </Typography.Paragraph>
        <Typography.Paragraph>
          Google 使用广告 Cookie 可让其及其合作伙伴基于你的访问记录提供广告。你可以访问 Google
          广告设置页面管理个性化广告偏好，也可访问
          www.aboutads.info 了解如何停用部分第三方个性化广告。
        </Typography.Paragraph>
        <Typography.Paragraph>
          请注意，停用个性化广告可能会导致你看到的广告更不相关，但不会减少你看到的广告数量。
        </Typography.Paragraph>
        <Typography.Paragraph>
          网站是免费的，展示广告仅用于支持网站运营。同时，我们承诺保护你的隐私，不会将你的个人信息用于广告目的。
        </Typography.Paragraph>
        <Typography.Paragraph>
          数据保留期限：我们仅在实现服务目的所必需的期间内保留反馈信息。通常反馈记录保留不超过 24
          个月，超过期限后会按运营策略删除或匿名化处理。
        </Typography.Paragraph>
        <Typography.Paragraph>
          你的权利：你可以通过 Contact 页面提供的邮箱请求访问、更正或删除你的反馈相关个人信息，我们会在合理时间内处理。
        </Typography.Paragraph>
        <Typography.Paragraph>
          未成年人保护：若你是未满 14 周岁的未成年人，请在监护人指导下使用本站，并由监护人代为联系处理个人信息相关请求。
        </Typography.Paragraph>
        <Typography.Paragraph>
          生效日期：2026-03-27。本政策可能根据服务调整更新，更新后会在本页发布。继续使用本站即视为你已知悉并同意最新政策。
        </Typography.Paragraph>
        <Typography.Paragraph>
          如你对隐私处理有疑问，可通过 Contact 页面所述方式与我们联系。你也可以阅读 Terms 页面了解服务条款与免责声明。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
