import { useState } from 'react'
import { Button, Input, Alert, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import ToolPageLayout from '../../components/ToolPageLayout'

const { TextArea } = Input

export default function JsonValidate() {
  const [input, setInput] = useState('')
  const [valid, setValid] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleValidate = () => {
    if (!input.trim()) {
      message.warning('请输入 JSON')
      return
    }
    try {
      JSON.parse(input)
      setValid(true)
      setErrorMsg('')
      message.success('校验通过：合法 JSON')
    } catch (e) {
      setValid(false)
      setErrorMsg((e as Error).message)
      message.error('校验失败')
    }
  }

  return (
    <ToolPageLayout
      title="JSON 校验"
      description="检测输入是否为合法 JSON"
      left={
        <>
          <TextArea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setValid(null)
            }}
            placeholder="输入待校验的 JSON 字符串"
            rows={14}
            style={{ fontFamily: 'monospace' }}
          />
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleValidate} style={{ marginTop: 8 }}>
            校验
          </Button>
        </>
      }
      right={
        <div style={{ padding: '8px 0' }}>
          {valid === true && (
            <Alert type="success" message="合法 JSON" description="解析成功，结构正确。" showIcon icon={<CheckCircleOutlined />} />
          )}
          {valid === false && <Alert type="error" message="非法 JSON" description={errorMsg} showIcon />}
          {valid === null && (
            <Alert type="info" message="未校验" description="在左侧输入 JSON 后点击「校验」。" showIcon />
          )}
        </div>
      }
    />
  )
}
