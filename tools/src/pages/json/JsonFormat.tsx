import { useState } from 'react'
import { Button, Input, Space, Typography, message, List } from 'antd'
import { FormatPainterOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import ToolPageLayout from '../../components/ToolPageLayout'
import { useLocalHistory } from '../../utils/useLocalHistory'

const { TextArea } = Input

export default function JsonFormat() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { items, add, clear } = useLocalHistory<{ input: string; output: string }>('json-format-history')

  const handleFormat = () => {
    setError(null)
    if (!input.trim()) {
      message.warning('请输入 JSON')
      return
    }
    try {
      const parsed = JSON.parse(input)
      const pretty = JSON.stringify(parsed, null, 2)
      setOutput(pretty)
      add({ input, output: pretty })
      message.success('格式化成功')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
      message.error('非法 JSON')
    }
  }

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output)
      message.success('已复制到剪贴板')
    }
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.json'
    a.click()
    URL.revokeObjectURL(url)
    message.success('已下载')
  }

  return (
    <ToolPageLayout
      title="JSON 格式化"
      description="将压缩的 JSON 格式化为易读形式（Pretty Print）"
      left={
        <>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name":"example","count":1}'
            rows={14}
            style={{ fontFamily: 'monospace' }}
          />
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" icon={<FormatPainterOutlined />} onClick={handleFormat}>
              格式化
            </Button>
          </Space>
        </>
      }
      right={
        <>
          {error && (
            <Typography.Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
              {error}
            </Typography.Text>
          )}
          <TextArea
            value={output}
            readOnly
            rows={14}
            style={{ fontFamily: 'monospace', marginBottom: 8 }}
          />
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>
              复制
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!output}>
              导出
            </Button>
            {items.length > 0 && (
              <Button danger type="link" size="small" onClick={clear}>
                清空历史
              </Button>
            )}
          </Space>
          {items.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary" style={{ marginBottom: 4, display: 'block' }}>
                历史记录（点击回填）
              </Typography.Text>
              <List
                size="small"
                bordered
                dataSource={items}
                style={{ maxHeight: 200, overflow: 'auto' }}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setInput(item.data.input)
                      setOutput(item.data.output)
                      setError(null)
                    }}
                  >
                    <Typography.Text ellipsis style={{ maxWidth: '100%' }}>
                      {item.data.output.slice(0, 80).replace(/\s+/g, ' ')}
                    </Typography.Text>
                  </List.Item>
                )}
              />
            </div>
          )}
        </>
      }
    />
  )
}
