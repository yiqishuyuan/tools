import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Image, Input, message, Space, Typography } from 'antd'
import { Helmet } from 'react-helmet-async'
import ToolPageLayout from '../components/ToolPageLayout'
import type { ToolDefinition, ToolField } from '../utils/toolCatalog'
import { executeTool } from '../utils/toolExecutor'

const SITE_NAME = '在线工具集'

const { TextArea } = Input

type UploadedFileValue = {
  name: string
  type: string
  size: number
  contentBase64: string
}

async function readFileAsBase64(file: File): Promise<UploadedFileValue> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    contentBase64: btoa(binary),
  }
}

function renderField(
  field: ToolField,
  value: unknown,
  onChange: (nextValue: unknown) => void,
) {
  switch (field.type) {
    case 'textarea':
      return (
        <TextArea
          rows={4}
          className="tool-textarea"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'password':
      return (
        <Input.Password
          className="tool-input"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'number':
      return (
        <Input
          className="tool-input"
          type="number"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      )
    case 'select':
      return (
        <select
          value={String(value ?? field.defaultValue ?? '')}
          onChange={(event) => onChange(event.target.value)}
          className="tool-native-select"
        >
          {field.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )
    case 'checkbox':
      return (
        <label className="tool-checkbox">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{field.label}</span>
        </label>
      )
    case 'date':
      return (
        <Input
          className="tool-input"
          type="date"
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case 'file': {
      const isMultiple = field.multiple === true
      const fileValue = value as UploadedFileValue | UploadedFileValue[] | undefined
      return (
        <div className="tool-upload">
          <input
            className="tool-upload__input"
            type="file"
            accept={field.accept}
            multiple={isMultiple}
            onChange={async (event) => {
              const list = event.target.files
              if (!list?.length) {
                onChange(isMultiple ? [] : undefined)
                return
              }
              if (isMultiple) {
                const arr = await Promise.all(Array.from(list).map((f) => readFileAsBase64(f)))
                onChange(arr)
              } else {
                onChange(await readFileAsBase64(list[0]))
              }
            }}
          />
          {fileValue && (
            <Typography.Text type="secondary">
              {isMultiple && Array.isArray(fileValue)
                ? `已选择 ${fileValue.length} 个文件：${(fileValue as UploadedFileValue[]).map((f) => f.name).join(', ')}`
                : `已选择：${(fileValue as UploadedFileValue).name}（${((fileValue as UploadedFileValue).size / 1024).toFixed(1)} KB）`}
            </Typography.Text>
          )}
        </div>
      )
    }
    default:
      return (
        <Input
          className="tool-input"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )
  }
}

function buildDefaultOptions(tool: ToolDefinition) {
  return (tool.fields ?? []).reduce<Record<string, unknown>>((accumulator, field) => {
    if (field.type === 'file' && field.multiple) {
      accumulator[field.key] = field.defaultValue ?? []
    } else {
      accumulator[field.key] =
        field.defaultValue ?? (field.type === 'checkbox' ? false : field.type === 'file' ? undefined : '')
    }
    return accumulator
  }, {})
}

export default function ToolPage({ tool }: { tool: ToolDefinition }) {
  const [input, setInput] = useState('')
  const [secondaryInput, setSecondaryInput] = useState('')
  const [options, setOptions] = useState<Record<string, unknown>>(() =>
    buildDefaultOptions(tool),
  )
  const [output, setOutput] = useState('')
  const [previewImage, setPreviewImage] = useState<string>()
  const [downloadFile, setDownloadFile] = useState<{
    filename: string
    mimeType: string
    contentBase64: string
  }>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInput('')
    setSecondaryInput('')
    setOutput('')
    setPreviewImage(undefined)
    setDownloadFile(undefined)
    setOptions(buildDefaultOptions(tool))
  }, [tool])

  const copyDisabled = useMemo(() => !output, [output])

  const handleRun = async () => {
    if (tool.mode === 'single' && !input.trim()) {
      message.warning('请输入内容')
      return
    }
    if (tool.mode === 'compare' && (!input.trim() || !secondaryInput.trim())) {
      message.warning('请填写两侧输入内容')
      return
    }
    // generator 且含日期字段时，必填日期校验
    if (tool.mode === 'generator' && tool.fields?.length) {
      const dateFields = tool.fields.filter((f) => f.type === 'date')
      for (const field of dateFields) {
        const value = options[field.key]
        if (value === undefined || value === null || String(value).trim() === '') {
          message.warning('请选择日期')
          return
        }
      }
    }
    // 需要上传文件的工具（走后端）必须先选择文件
    const fileField = (tool.fields ?? []).find((f) => f.type === 'file')
    if (fileField && !tool.frontend) {
      const fileValue = options[fileField.key]
      if (fileField.multiple) {
        if (!Array.isArray(fileValue) || fileValue.length === 0 || !fileValue.every((f: unknown) => f && typeof f === 'object' && (f as { contentBase64?: string }).contentBase64)) {
          message.warning('请至少选择一个文件')
          return
        }
      } else if (!fileValue || typeof fileValue !== 'object' || !(fileValue as { contentBase64?: string }).contentBase64) {
        message.warning('请先选择要转换的文件')
        return
      }
    }

    setLoading(true)
    try {
      const result = await executeTool(tool, { input, secondaryInput, options })
      setOutput(result.output)
      setPreviewImage(result.previewImage)
      setDownloadFile(result.downloadFile)
      message.success('处理完成')
    } catch (error) {
      const text = error instanceof Error ? error.message : '处理失败'
      setOutput(text)
      setPreviewImage(undefined)
      setDownloadFile(undefined)
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setSecondaryInput('')
    setOutput('')
    setPreviewImage(undefined)
    setDownloadFile(undefined)
    setOptions(buildDefaultOptions(tool))
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    message.success('已复制输出')
  }

  const handleDownload = () => {
    if (!downloadFile) return
    const link = document.createElement('a')
    link.href = `data:${downloadFile.mimeType};base64,${downloadFile.contentBase64}`
    link.download = downloadFile.filename
    link.click()
    message.success('已开始下载')
  }

  const keywords = tool.keywords?.length ? tool.keywords.join(', ') : `${tool.name}, 在线工具`

  return (
    <>
      <Helmet>
        <title>{`${tool.name} - ${SITE_NAME}`}</title>
        <meta name="description" content={tool.description} />
        <meta name="keywords" content={keywords} />
      </Helmet>
      <ToolPageLayout
        title={tool.name}
        description={tool.description}
      onClear={handleClear}
      onCopy={handleCopy}
      copyDisabled={copyDisabled}
      actionNode={
        <Button type="primary" onClick={handleRun} loading={loading}>
          {tool.actionLabel}
        </Button>
      }
      inputContent={
        <div className="tool-form-stack">
          {tool.mode !== 'generator' && (
            <div className="tool-field-block">
              <Typography.Text strong className="tool-field-label">{tool.inputLabel ?? '输入'}</Typography.Text>
              <TextArea
                rows={12}
                className="tool-textarea tool-textarea--editor"
                value={input}
                placeholder={tool.placeholder ?? '请输入内容'}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
          )}

          {tool.mode === 'compare' && (
            <div className="tool-field-block">
              <Typography.Text strong className="tool-field-label">{tool.secondaryInputLabel ?? '输入 B'}</Typography.Text>
              <TextArea
                rows={12}
                className="tool-textarea tool-textarea--editor"
                value={secondaryInput}
                placeholder={tool.secondaryPlaceholder ?? '请输入第二段内容'}
                onChange={(event) => setSecondaryInput(event.target.value)}
              />
            </div>
          )}

          {(tool.fields ?? []).length > 0 && (
            <>
              {tool.mode === 'generator' && (tool.fields ?? []).some((f) => f.type === 'file') && (
                <Typography.Text type="secondary" className="tool-field-label" style={{ display: 'block', marginBottom: 8 }}>
                  请选择要处理的文件（带 * 的为必填）
                </Typography.Text>
              )}
              <Form layout="vertical" className="tool-form">
                <div className="tool-form-stack tool-form-stack--compact">
                {tool.fields?.map((field) => (
                  <Form.Item key={field.key} label={field.type === 'checkbox' ? undefined : field.label} style={{ marginBottom: 0 }}>
                    {renderField(field, options[field.key], (nextValue) =>
                      setOptions((current) => ({ ...current, [field.key]: nextValue })),
                    )}
                  </Form.Item>
                ))}
                </div>
              </Form>
            </>
          )}
        </div>
      }
      outputContent={
        <div className="tool-result-stack">
          {previewImage && (
            <div className="tool-preview-block">
              <Typography.Text strong className="tool-field-label">预览</Typography.Text>
              <div className="tool-preview-frame">
                <Image src={previewImage} alt={tool.name} style={{ maxWidth: '100%' }} />
              </div>
            </div>
          )}

          <div className="tool-field-block">
            <Typography.Text strong className="tool-field-label">处理结果</Typography.Text>
            <TextArea
              rows={previewImage ? 8 : 18}
              className="tool-textarea tool-textarea--editor"
              value={output}
              readOnly
              placeholder="结果会显示在这里"
            />
          </div>

          <Space wrap className="tool-status-row">
            <Typography.Text className="tool-status-chip">
              当前工具：{tool.frontend ? '前端本地处理' : '通过 服务器 处理'}
            </Typography.Text>
            {downloadFile && (
              <Button className="tool-download-button" onClick={handleDownload}>
                下载结果文件
              </Button>
            )}
          </Space>
        </div>
      }
    />
    </>
  )
}
