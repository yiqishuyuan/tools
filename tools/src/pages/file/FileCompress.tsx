import { useState } from 'react'
import { Button, Upload, Card, Typography, message } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import JSZip from 'jszip'

const { Dragger } = Upload

export default function FileCompress() {
  const [files, setFiles] = useState<File[]>([])
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = (file: File) => {
    setFiles((prev) => [...prev, file])
    setZipBlob(null)
    return false
  }

  const handleCompress = async () => {
    if (files.length === 0) {
      message.warning('请先选择要压缩的文件')
      return
    }
    setLoading(true)
    try {
      const zip = new JSZip()
      for (const f of files) {
        zip.file(f.name, f)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      setZipBlob(blob)
      message.success('压缩完成')
    } catch {
      message.error('压缩失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!zipBlob) return
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'archive.zip'
    a.click()
    URL.revokeObjectURL(url)
    message.success('已下载')
  }

  const clearFiles = () => {
    setFiles([])
    setZipBlob(null)
  }

  return (
    <div>
      <Typography.Title level={3}>文件压缩（ZIP）</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        选择多个文件，打包为 ZIP 下载。7z 需后端支持。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="选择文件" size="small">
          <Dragger multiple beforeUpload={handleUpload} showUploadList={false}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处</p>
          </Dragger>
          {files.length > 0 && (
            <>
              <p>已选 {files.length} 个文件</p>
              <Button type="primary" onClick={handleCompress} loading={loading}>打包 ZIP</Button>
              <Button style={{ marginLeft: 8 }} onClick={clearFiles}>清空</Button>
            </>
          )}
        </Card>
        <Card title="压缩包" size="small">
          {zipBlob ? (
            <>
              <p>ZIP 大小：{(zipBlob.size / 1024).toFixed(1)} KB</p>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载 ZIP</Button>
            </>
          ) : (
            <Typography.Text type="secondary">打包后将在此提供下载。</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  )
}
