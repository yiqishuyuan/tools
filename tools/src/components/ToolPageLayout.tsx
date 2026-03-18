import type { ReactNode } from 'react'
import { Button, Card, Space, Typography } from 'antd'

const { Title, Paragraph } = Typography

type ToolPageLayoutProps = {
  title: string
  description?: string
  inputContent?: ReactNode
  outputContent?: ReactNode
  actionNode?: ReactNode
  onClear?: () => void
  onCopy?: () => void
  copyDisabled?: boolean
  left?: ReactNode
  right?: ReactNode
}

export default function ToolPageLayout({
  title,
  description,
  inputContent,
  outputContent,
  actionNode,
  onClear,
  onCopy,
  copyDisabled,
  left,
  right,
}: ToolPageLayoutProps) {
  const finalInputContent = inputContent ?? left
  const finalOutputContent = outputContent ?? right

  return (
    <div className="tool-page-shell">
      <div className="tool-page-hero">
        <Typography.Text className="tool-page-hero__eyebrow">
          TOOL WORKSPACE
        </Typography.Text>
        <Title level={2} className="tool-page-hero__title">
          {title}
        </Title>
        <Paragraph className="tool-page-hero__desc">
          {description}
        </Paragraph>
      </div>

      <div className="tool-grid">
        <Card
          className="tool-panel tool-panel--input"
          title="输入区域"
          extra={onClear ? <Button className="tool-panel__action" onClick={onClear}>清空</Button> : undefined}
        >
          <div className="tool-panel__body">
            {finalInputContent}
            {actionNode && <Space wrap className="tool-panel__footer">{actionNode}</Space>}
          </div>
        </Card>

        <Card
          className="tool-panel tool-panel--output"
          title="输出区域"
          extra={
            onCopy ? (
              <Button className="tool-panel__action" onClick={onCopy} disabled={copyDisabled}>
                复制结果
              </Button>
            ) : undefined
          }
        >
          <div className="tool-panel__body">{finalOutputContent}</div>
        </Card>
      </div>
    </div>
  )
}
