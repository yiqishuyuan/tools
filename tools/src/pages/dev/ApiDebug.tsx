import { useState } from 'react'
import { Button, Input, Select, Card, Typography, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { parseHeaderText, sendHttpRequest } from '../../api/http'

const { TextArea } = Input

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export default function ApiDebug() {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [method, setMethod] = useState<Method>('GET')
  const [body, setBody] = useState('')
  const [headers, setHeaders] = useState('Content-Type: application/json')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [responseText, setResponseText] = useState('')
  const [time, setTime] = useState<number | null>(null)

  const handleSend = async () => {
    if (!url.trim()) {
      message.warning('请输入 URL')
      return
    }
    setLoading(true)
    setStatus(null)
    setResponseText('')
    setTime(null)
    const start = performance.now()
    try {
      const headerObj = parseHeaderText(headers)
      let requestBody = ''
      if (method !== 'GET' && body.trim()) {
        try {
          requestBody = JSON.stringify(JSON.parse(body))
        } catch {
          requestBody = body
        }
      }
      const response = await sendHttpRequest({
        url,
        method,
        headers: headerObj,
        body: requestBody,
      })
      setStatus(response.status)
      setResponseText(
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body, null, 2),
      )
      setTime(Math.round(performance.now() - start))
      message.success('请求完成')
    } catch (e) {
      setResponseText((e as Error).message)
      message.error('请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Typography.Title level={3}>接口调试</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        发送 GET/POST 等请求，查看响应（类似 Postman）。
      </Typography.Text>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            value={method}
            onChange={setMethod}
            options={[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
            ]}
            style={{ width: 100 }}
          />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="请求 URL" style={{ flex: 1, minWidth: 200 }} />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
            发送
          </Button>
        </div>
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">请求头（每行一个 Key: Value）</Typography.Text>
          <TextArea value={headers} onChange={(e) => setHeaders(e.target.value)} rows={3} style={{ fontFamily: 'monospace', marginTop: 4 }} />
        </div>
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary">请求体（JSON）</Typography.Text>
            <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={4} style={{ fontFamily: 'monospace', marginTop: 4 }} />
          </div>
        )}
      </Card>
      <Card title={status != null ? `响应 ${status}${time != null ? ` · ${time} ms` : ''}` : '响应'} size="small">
        <TextArea readOnly value={responseText} rows={14} style={{ fontFamily: 'monospace' }} />
      </Card>
    </div>
  )
}
