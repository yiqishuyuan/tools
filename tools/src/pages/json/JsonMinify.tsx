import { useState } from 'react'
import { Button, Input, Space, message } from 'antd'
import { CompressOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import ToolPageLayout from '../../components/ToolPageLayout'

const { TextArea } = Input

export default function JsonMinify() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleMinify = () => {
    setError(null)
    if (!input.trim()) {
      message.warning('请输入 JSON')
      return
    }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      message.success('压缩成功')
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
    a.download = 'minified.json'
    a.click()
    URL.revokeObjectURL(url)
    message.success('已下载')
  }

  return (
    <ToolPageLayout
      title="JSON 压缩"
      description="移除 JSON 中的空格与换行，得到最小体积"
      left={
        <>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "example", "count": 1}'
            rows={14}
            style={{ fontFamily: 'monospace' }}
          />
          <Button type="primary" icon={<CompressOutlined />} onClick={handleMinify} style={{ marginTop: 8 }}>
            压缩
          </Button>
        </>
      }
      right={
        <>
          {error && <span style={{ color: '#ff4d4f' }}>{error}</span>}
          <TextArea value={output} readOnly rows={14} style={{ fontFamily: 'monospace', marginBottom: 8 }} />
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>
              复制
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!output}>
              导出
            </Button>
          </Space>
        </>
      }
    />
  )
}
