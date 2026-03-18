import { useState } from 'react'
import { Button, Upload, Input, Select, Typography, message } from 'antd'
import { InboxOutlined, LockOutlined, UnlockOutlined, DownloadOutlined } from '@ant-design/icons'
import ToolPageLayout from '../../components/ToolPageLayout'

const { Dragger } = Upload

async function aesEncryptFile(file: File, keyStr: string): Promise<Blob> {
  const buf = await file.arrayBuffer()
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyStr.padEnd(32).slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    buf
  )
  const combined = new Uint8Array(iv.length + enc.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(enc), iv.length)
  return new Blob([combined])
}

async function aesDecryptFile(blob: Blob, keyStr: string): Promise<Blob> {
  const buf = await blob.arrayBuffer()
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyStr.padEnd(32).slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const raw = new Uint8Array(buf)
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new Blob([dec])
}

export default function FileCrypto() {
  const [file, setFile] = useState<File | null>(null)
  const [key, setKey] = useState('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [op, setOp] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [loading, setLoading] = useState(false)

  const handleUpload = (f: File) => {
    setFile(f)
    setResultBlob(null)
    return false
  }

  const handleRun = async () => {
    if (!file || !key.trim()) {
      message.warning('请选择文件并输入密钥')
      return
    }
    setLoading(true)
    try {
      if (op === 'encrypt') {
        setResultBlob(await aesEncryptFile(file, key))
        message.success('加密完成')
      } else {
        setResultBlob(await aesDecryptFile(file, key))
        message.success('解密完成')
      }
    } catch {
      message.error('操作失败（密钥或文件格式可能错误）')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    const ext = op === 'encrypt' ? '.enc' : ''
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = (file?.name ?? 'file') + ext
    a.click()
    URL.revokeObjectURL(url)
    message.success('已下载')
  }

  return (
    <ToolPageLayout
      title="文件加密/解密（AES）"
      description="使用 AES-GCM 对文件加密或解密，密钥 32 字符内"
      left={
        <>
          <Select value={op} onChange={setOp} options={[
            { value: 'encrypt', label: '加密' },
            { value: 'decrypt', label: '解密' },
          ]} style={{ width: 100, marginBottom: 8 }} />
          <Input.Password value={key} onChange={(e) => setKey(e.target.value)} placeholder="密钥" style={{ marginBottom: 8 }} />
          <Dragger beforeUpload={handleUpload} showUploadList={false} maxCount={1}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">选择文件</p>
          </Dragger>
          {file && <p style={{ marginTop: 8 }}>{file.name}</p>}
          <Button type="primary" icon={op === 'encrypt' ? <LockOutlined /> : <UnlockOutlined />} onClick={handleRun} loading={loading} style={{ marginTop: 8 }}>执行</Button>
        </>
      }
      right={
        <>
          {resultBlob ? (
            <>
              <p>结果大小：{(resultBlob.size / 1024).toFixed(1)} KB</p>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
            </>
          ) : (
            <Typography.Text type="secondary">加密/解密后将在此提供下载。</Typography.Text>
          )}
        </>
      }
    />
  )
}
