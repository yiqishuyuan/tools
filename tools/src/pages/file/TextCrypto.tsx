import { useState } from 'react'
import { Button, Input, Select, Typography, message } from 'antd'
import { LockOutlined, UnlockOutlined } from '@ant-design/icons'
import ToolPageLayout from '../../components/ToolPageLayout'

const { TextArea } = Input

function base64Encode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
}

function base64Decode(s: string): string {
  try {
    return decodeURIComponent(escape(atob(s)))
  } catch {
    return ''
  }
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function aesEncrypt(plain: string, keyStr: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyStr.padEnd(32).slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  const combined = new Uint8Array(iv.length + enc.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(enc), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function aesDecrypt(cipher: string, keyStr: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyStr.padEnd(32).slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const raw = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(dec)
}

type Mode = 'base64' | 'hash' | 'aes'

export default function TextCrypto() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<Mode>('base64')
  const [op, setOp] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!input.trim()) {
      message.warning('请输入内容')
      return
    }
    if (mode === 'aes' && !key.trim()) {
      message.warning('请输入密钥')
      return
    }
    setLoading(true)
    try {
      if (mode === 'base64') {
        setOutput(op === 'encrypt' ? base64Encode(input) : base64Decode(input))
      } else if (mode === 'hash') {
        if (op === 'decrypt') {
          setOutput('哈希值不可逆，无法解密')
        } else {
          setOutput(await sha256(input))
        }
      } else {
        if (op === 'encrypt') setOutput(await aesEncrypt(input, key))
        else setOutput(await aesDecrypt(input, key))
      }
      message.success('完成')
    } catch (e) {
      setOutput((e as Error).message)
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPageLayout
      title="文本加密 / 解密"
      description="支持 Base64、SHA-256 哈希与 AES-GCM 加解密（在浏览器本地执行）。"
      left={
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <Select
              value={mode}
              onChange={setMode}
              options={[
                { value: 'base64', label: 'Base64' },
                { value: 'hash', label: 'SHA-256 哈希' },
                { value: 'aes', label: 'AES-GCM' },
              ]}
              style={{ width: 160 }}
            />
            <Select
              value={op}
              onChange={setOp}
              options={[
                { value: 'encrypt', label: '加密 / 编码' },
                { value: 'decrypt', label: '解密 / 解码' },
              ]}
              style={{ width: 140 }}
            />
          </div>
          {mode === 'aes' && (
            <Input.Password
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="密钥（任意字符串，建议 8~32 位）"
              style={{ marginBottom: 8 }}
            />
          )}
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            placeholder="输入要处理的文本"
          />
          <Button
            type="primary"
            icon={op === 'encrypt' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={handleRun}
            loading={loading}
            style={{ marginTop: 8 }}
          >
            执行
          </Button>
        </>
      }
      right={
        <>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            结果
          </Typography.Text>
          <TextArea value={output} readOnly rows={14} placeholder="结果将显示在这里" />
        </>
      }
    />
  )
}

