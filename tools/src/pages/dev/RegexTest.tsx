import { useState } from 'react'
import { Button, Input, Typography, message } from 'antd'
import ToolPageLayout from '../../components/ToolPageLayout'

const { TextArea } = Input

export default function RegexTest() {
  const [text, setText] = useState('')
  const [regexStr, setRegexStr] = useState('')
  const [flags, setFlags] = useState('g')
  const [result, setResult] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleTest = () => {
    setError(null)
    if (!regexStr.trim()) {
      message.warning('请输入正则表达式')
      return
    }
    try {
      const re = new RegExp(regexStr, flags.includes('g') ? flags : flags + 'g')
      const matches: string[] = []
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        matches.push(m[0])
      }
      setResult(matches)
      message.success('匹配完成')
    } catch (e) {
      setError((e as Error).message)
      setResult([])
      message.error('正则无效')
    }
  }

  return (
    <ToolPageLayout
      title="正则表达式测试"
      description="输入文本和正则，查看匹配结果"
      left={
        <>
          <Typography.Text strong>正则</Typography.Text>
          <Input
            value={regexStr}
            onChange={(e) => setRegexStr(e.target.value)}
            placeholder="如 \\d+"
            style={{ marginBottom: 8 }}
          />
          <Typography.Text strong>标志</Typography.Text>
          <Input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="g, i, m"
            style={{ marginBottom: 8 }}
          />
          <Typography.Text strong>文本</Typography.Text>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
          <Button type="primary" onClick={handleTest} style={{ marginTop: 8 }}>
            匹配
          </Button>
        </>
      }
      right={
        <>
          {error && (
            <Typography.Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
              {error}
            </Typography.Text>
          )}
          <Typography.Text strong>匹配结果（{result.length} 个）</Typography.Text>
          <TextArea
            readOnly
            value={result.join('\n')}
            rows={14}
            style={{ fontFamily: 'monospace', marginTop: 8 }}
          />
        </>
      }
    />
  )
}

