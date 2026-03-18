import { useState } from 'react'
import { Button, Upload, Card, Typography, message } from 'antd'
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'
import JSZip from 'jszip'

const { Dragger } = Upload

export default function FileExtract() {
  const [entries, setEntries] = useState<{ name: string; blob: Blob }[]>([])

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      message.error('请选择 ZIP 文件')
      return false
    }
    try {
      const zip = await JSZip.loadAsync(file)
      const list: { name: string; blob: Blob }[] = []
      zip.forEach((path, entry) => {
        if (!entry.dir) {
          list.push({ name: path, blob: new Blob() })
        }
      })
      for (let i = 0; i < list.length; i++) {
        const entry = zip.file(list[i].name)
        if (entry) list[i].blob = await entry.async('blob')
      }
      setEntries(list)
      message.success('解压列表已加载')
    } catch (e) {
      console.error(e)
      message.error('无法解析 ZIP')
    }
    return false
  }

  const downloadOne = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name.split('/').pop() ?? name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Typography.Title level={3}>文件解压（ZIP）</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        上传 ZIP 文件，查看并下载其中的文件。7z 解压建议放到后端实现。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="上传 ZIP" size="small">
          <Dragger accept=".zip" beforeUpload={handleUpload} showUploadList={false} maxCount={1}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽 ZIP 到此处</p>
          </Dragger>
        </Card>
        <Card title="文件列表" size="small">
          {entries.length > 0 ? (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {entries.map((e, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.name}
                  </span>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadOne(e.name, e.blob)}
                  >
                    下载
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text type="secondary">上传 ZIP 后在此列出文件。</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  )
}

