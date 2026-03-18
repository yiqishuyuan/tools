import { useState } from 'react'
import { Button, Slider, Upload, Card, Typography, message, Image } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import imageCompression from 'browser-image-compression'

const { Dragger } = Upload
const { Text } = Typography

export default function ImageCompress() {
  const [file, setFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [quality, setQuality] = useState(0.8)
  const [loading, setLoading] = useState(false)
  const [originalSize, setOriginalSize] = useState(0)
  const [resultSize, setResultSize] = useState(0)

  const handleUpload = (f: File) => {
    if (!f.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return false
    }
    setFile(f)
    setOriginalSize(f.size)
    setResultUrl(null)
    setResultSize(0)
    return false
  }

  const handleCompress = async () => {
    if (!file) {
      message.warning('请先选择图片')
      return
    }
    setLoading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality,
      })
      const url = URL.createObjectURL(compressed)
      setResultUrl(url)
      setResultSize(compressed.size)
      message.success('压缩完成')
    } catch {
      message.error('压缩失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = file ? 'compressed_' + file.name : 'compressed.png'
    a.click()
    message.success('已下载')
  }

  return (
    <div>
      <Typography.Title level={3}>图片压缩</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        支持 PNG、JPG、WebP，浏览器内压缩。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="上传图片" size="small">
          <Dragger accept="image/*" beforeUpload={handleUpload} showUploadList={false} maxCount={1}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此处</p>
          </Dragger>
          {file && (
            <>
              <p style={{ marginTop: 8 }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
              <Slider min={0.1} max={1} step={0.05} value={quality} onChange={setQuality} />
              <Text type="secondary">质量 {Math.round(quality * 100)}%</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" onClick={handleCompress} loading={loading}>压缩</Button>
              </div>
            </>
          )}
        </Card>
        <Card title="压缩结果" size="small">
          {resultUrl ? (
            <>
              <Image src={resultUrl} alt="compressed" style={{ maxWidth: '100%', maxHeight: 300 }} />
              <p>原始 {(originalSize / 1024).toFixed(1)} KB，压缩后 {(resultSize / 1024).toFixed(1)} KB</p>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
            </>
          ) : (
            <Typography.Text type="secondary">压缩后在此显示。</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  )
}
