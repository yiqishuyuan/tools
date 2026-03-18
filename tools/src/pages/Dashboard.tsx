import { SearchOutlined } from '@ant-design/icons'
import { Card, Col, Input, Row, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { allTools, toolCategories } from '../utils/toolCatalog'

const { Title, Paragraph } = Typography

const SITE_NAME = '在线工具集'

export default function Dashboard() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return toolCategories

    return toolCategories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) =>
          [tool.name, tool.description, ...tool.keywords].some((item) =>
            item.toLowerCase().includes(normalizedQuery),
          ),
        ),
      }))
      .filter((category) => category.tools.length > 0)
  }, [normalizedQuery])

  return (
    <div className="dashboard-shell">
      <Helmet>
        <title>{SITE_NAME} - JSON / 图片 / 开发 / 文档 / 文件</title>
        <meta name="description" content="按任务场景组织分类的在线工具集，支持 JSON、Base64、时间戳、EPUB 转换、正则测试等，统一交互，快速定位与处理。" />
        <meta name="keywords" content="在线工具,JSON,Base64,时间戳,EPUB,正则,编码解码,开发工具" />
      </Helmet>
      <div className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <Typography.Text className="dashboard-hero__eyebrow">
            CURATED TOOL SPACE
          </Typography.Text>
          <Title level={1} className="dashboard-hero__title">
            把零散小工具做成一套真正顺手的工作台
          </Title>
          <Paragraph className="dashboard-hero__desc">
            更加高效、便捷工具库，创建顺手的工作环境，提供快速的信息编辑/创造/处理的服务。
          </Paragraph>
          <div className="dashboard-hero__stats">
            <div className="dashboard-stat">
              <strong>{allTools.length}</strong>
              <span>可用工具</span>
            </div>
            <div className="dashboard-stat">
              <strong>{toolCategories.length}</strong>
              <span>分类分区</span>
            </div>
            <div className="dashboard-stat">
              <strong>双模式</strong>
              <span>前端与后端</span>
            </div>
          </div>
        </div>

        <div className="dashboard-search-panel">
          <Typography.Text className="dashboard-search-panel__label">
            快速定位工具
          </Typography.Text>
          <Input
            size="large"
            prefix={<SearchOutlined />}
            value={query}
            className="dashboard-search"
            placeholder={`搜索 ${allTools.length} 个工具，例如 JSON、Base64、时间戳`}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Paragraph className="dashboard-search-panel__hint">
            试试搜索“EPUB”“正则”“时间戳”“压缩”“哈希”
          </Paragraph>
        </div>
      </div>

      <Row gutter={[18, 18]}>
        {filteredCategories.map((category) => (
          <Col xs={24} md={12} xl={8} key={category.key}>
            <Card
              hoverable
              className="category-card"
              onClick={() => navigate(category.tools[0]?.path || '/')}
            >
              <div className="category-card__header">
                <div
                  className="category-card__icon"
                  style={{ background: `${category.color}1a`, color: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <Title level={4} className="category-card__title">
                    {category.title}
                  </Title>
                  <Paragraph className="category-card__desc">
                    {category.description}
                  </Paragraph>
                </div>
              </div>

              <div className="category-card__meta">
                <span>{category.tools.length} 个工具</span>
                <span>点击进入</span>
              </div>

              <div className="category-card__tools">
                {category.tools.map((tool) => (
                  <Tag
                    key={tool.id}
                    bordered={false}
                    className="tool-tag"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(tool.path)
                    }}
                  >
                    {tool.name}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
