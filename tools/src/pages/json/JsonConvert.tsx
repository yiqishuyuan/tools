import { useState } from 'react'
import { Button, Input, Select, Space, message } from 'antd'
import ToolPageLayout from '../../components/ToolPageLayout'

const { TextArea } = Input

function jsonToCsv(obj: unknown): string {
  if (!Array.isArray(obj)) {
    obj = [obj]
  }
  const arr = obj as Record<string, unknown>[]
  if (arr.length === 0) return ''
  const headers = [...new Set(arr.flatMap((row) => Object.keys(row)))]
  const lines = [headers.join(',')]
  for (const row of arr) {
    const values = headers.map((h) => {
      const v = row[h]
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}

function jsonToXml(obj: unknown, tag = 'root'): string {
  if (obj === null || obj === undefined) return `<${tag}/>`
  if (typeof obj !== 'object') return `<${tag}>${String(obj)}</${tag}>`
  if (Array.isArray(obj)) {
    return obj.map((item) => jsonToXml(item, 'item')).join('')
  }
  const entries = Object.entries(obj as Record<string, unknown>)
  const inner = entries.map(([k, v]) => jsonToXml(v, /^\d+$/.test(k) ? 'item' : k)).join('')
  return `<${tag}>${inner}</${tag}>`
}

export default function JsonConvert() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<'csv' | 'xml'>('csv')
  const [error, setError] = useState<string | null>(null)

  const handleConvert = () => {
    setError(null)
    if (!input.trim()) {
      message.warning('请输入 JSON')
      return
    }
    try {
      const parsed = JSON.parse(input)
      if (format === 'csv') {
        setOutput(jsonToCsv(parsed))
      } else {
        setOutput('<?xml version="1.0" encoding="UTF-8"?>\n' + jsonToXml(parsed))
      }
      message.success('转换成功')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
      message.error('转换失败')
    }
  }

  return (
    <ToolPageLayout
      title="JSON 格式转换"
      description="将 JSON 转为 CSV 或 XML"
      left={
        <>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='[{"a":1,"b":2},{"a":3,"b":4}]'
            rows={14}
            style={{ fontFamily: 'monospace' }}
          />
          <Space style={{ marginTop: 8 }}>
            <Select value={format} onChange={setFormat} options={[{ value: 'csv', label: 'CSV' }, { value: 'xml', label: 'XML' }]} style={{ width: 100 }} />
            <Button type="primary" onClick={handleConvert}>
              转换
            </Button>
          </Space>
        </>
      }
      right={
        <>
          {error && <span style={{ color: '#ff4d4f' }}>{error}</span>}
          <TextArea value={output} readOnly rows={14} style={{ fontFamily: 'monospace' }} />
        </>
      }
    />
  )
}
