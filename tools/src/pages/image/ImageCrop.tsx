import { useRef, useState, useEffect } from 'react'
import { Button, Upload, Card, Typography, message } from 'antd'
import { InboxOutlined, ScissorOutlined, DownloadOutlined } from '@ant-design/icons'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const { Dragger } = Upload

export default function ImageCrop() {
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      cropperRef.current?.destroy()
    }
  }, [])

  const handleUpload = (f: File) => {
    if (!f.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return false
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    if (cropperRef.current) {
      cropperRef.current.destroy()
      cropperRef.current = null
    }
    setFile(f)
    setResultUrl(null)
    const url = URL.createObjectURL(f)
    setObjectUrl(url)
    setTimeout(() => {
      if (!imageRef.current) return
      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: NaN,
        viewMode: 1,
      })
    }, 100)
    return false
  }

  const handleCrop = () => {
    const cropper = cropperRef.current
    if (!cropper) {
      message.warning('请先选择图片')
      return
    }
    const canvas = cropper.getCroppedCanvas()
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
      message.success('裁剪完成')
    }, file?.type ?? 'image/png')
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `cropped_${file?.name ?? 'image'}`
    a.click()
    message.success('已下载')
  }

  return (
    <div>
      <Typography.Title level={3}>图片裁剪</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        上传图片后拖动选区裁剪，支持自由比例。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="选择图片并裁剪" size="small">
          <Dragger beforeUpload={handleUpload} showUploadList={false} accept="image/*" maxCount={1}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此处</p>
          </Dragger>
          {objectUrl && (
            <div style={{ marginTop: 16, maxHeight: 400, overflow: 'hidden' }}>
              <img
                ref={imageRef}
                src={objectUrl}
                alt="crop"
                style={{ maxWidth: '100%', display: 'block' }}
              />
              <Button type="primary" icon={<ScissorOutlined />} onClick={handleCrop} style={{ marginTop: 8 }}>
                裁剪
              </Button>
            </div>
          )}
        </Card>
        <Card title="裁剪结果" size="small">
          {resultUrl ? (
            <>
              <img src={resultUrl} alt="cropped" style={{ maxWidth: '100%', maxHeight: 350 }} />
              <Button icon={<DownloadOutlined />} onClick={handleDownload} style={{ marginTop: 8 }}>
                下载
              </Button>
            </>
          ) : (
            <Typography.Text type="secondary">裁剪后将在此显示结果。</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  )
}
