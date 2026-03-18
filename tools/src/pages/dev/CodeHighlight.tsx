import { useState, useEffect } from 'react'
import { Select, Input, Card, Typography } from 'antd'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

const { TextArea } = Input

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
]

export default function CodeHighlight() {
  const [code, setCode] = useState('function hello() {\n  console.log("Hi");\n}')
  const [lang, setLang] = useState('javascript')
  const [html, setHtml] = useState('')

  useEffect(() => {
    const g = Prism.languages[lang as keyof typeof Prism.languages] ?? Prism.languages.javascript
    setHtml(Prism.highlight(code, g, lang))
  }, [code, lang])

  return (
    <div>
      <Typography.Title level={3}>代码高亮</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        支持 JS、TS、Python、HTML、CSS、JSON、Bash。
      </Typography.Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="源代码" size="small">
          <Select value={lang} onChange={setLang} options={languages} style={{ width: 140, marginBottom: 8 }} />
          <TextArea value={code} onChange={(e) => setCode(e.target.value)} rows={16} style={{ fontFamily: 'monospace', fontSize: 13 }} />
        </Card>
        <Card title="高亮预览" size="small">
          <pre style={{ margin: 0, padding: 12, background: '#2d2d2d', borderRadius: 4, overflow: 'auto', maxHeight: 400 }}>
            <code className={'language-' + lang} dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        </Card>
      </div>
    </div>
  )
}
