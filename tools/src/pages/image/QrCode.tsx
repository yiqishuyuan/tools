import { useState, useEffect } from 'react'
import { Input, Select, Card, Typography, message } from 'antd'
import QRCode from 'qrcode'

const { TextArea } = Input

const types = [
  { value: 'text', label: '文本/URL' },
  { value: 'wifi', label: 'WiFi' },
]

export default function QrCode() {
  const [type, setType] = useState<'text' | 'wifi'>('text')
  const [input, setInput] = useState('https://example.com')
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [wifiEncrypt, setWifiEncrypt] = useState('WPA')
  const [dataUrl, setDataUrl] = useState('')

  const getContent = (): string => {
    if (type === 'wifi') {
      return `WIFI:T:${wifiEncrypt};S:${wifiSSID};P:${wifiPass};;`
    }
    return input
  }

  useEffect(() => {
    const content = getContent()
    if (!content.trim()) {
      setDataUrl('')
      return
    }
    QRCode.toDataURL(content, { width: 256, margin: 2 })
      .then(setDataUrl)
      .catch(() => message.error('生成失败'))
  }, [type, input, wifiSSID, wifiPass, wifiEncrypt])

  return (
    <div>
      <Typography.Title level={3}>生成二维码</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        支持文本、URL、WiFi 信息等，实时生成二维码。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="内容" size="small">
          <Select value={type} onChange={setType} options={types} style={{ width: '100%', marginBottom: 12 }} />
          {type === 'text' ? (
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入文本或 URL"
              rows={6}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input placeholder="WiFi 名称 (SSID)" value={wifiSSID} onChange={(e) => setWifiSSID(e.target.value)} />
              <Input.Password placeholder="密码" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} />
              <Select
                value={wifiEncrypt}
                onChange={setWifiEncrypt}
                options={[
                  { value: 'WPA', label: 'WPA/WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: '无密码' },
                ]}
              />
            </div>
          )}
        </Card>
        <Card title="二维码" size="small">
          {dataUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img src={dataUrl} alt="qrcode" style={{ maxWidth: 256 }} />
              <p>
                <a href={dataUrl} download="qrcode.png">
                  右键保存图片
                </a>
              </p>
            </div>
          ) : (
            <Typography.Text type="secondary">输入内容后将在此显示二维码。</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  )
}
