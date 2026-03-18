export interface NormalizedFilePayload {
  name: string
  extension: string
  buffer: Buffer
}

export function normalizeFilePayload(
  file: Record<string, unknown> | null | undefined,
  expectedExtensions: string[] = [],
): NormalizedFilePayload {
  if (!file || typeof file !== 'object') {
    const err = new Error('请上传文件后再转换。')
    ;(err as Error & { statusCode?: number }).statusCode = 400
    throw err
  }

  const name = (file.name as string) || (file.filename as string) || 'document'
  const contentBase64 = (file.contentBase64 as string) ?? ''
  if (!contentBase64) {
    const err = new Error('文件内容为空，请重新选择文件。')
    ;(err as Error & { statusCode?: number }).statusCode = 400
    throw err
  }

  const extension = name.includes('.')
    ? name.slice(name.lastIndexOf('.')).toLowerCase()
    : ''
  if (expectedExtensions.length > 0 && !expectedExtensions.includes(extension)) {
    const err = new Error(`不支持的文件类型：${extension || '未知'}，请上传正确格式。`)
    ;(err as Error & { statusCode?: number }).statusCode = 400
    throw err
  }

  return {
    name,
    extension,
    buffer: Buffer.from(contentBase64, 'base64'),
  }
}

export interface FileResult {
  output: string
  file: {
    filename: string
    mimeType: string
    contentBase64: string
  }
}

export function createFileResult(
  filename: string,
  mimeType: string,
  buffer: Buffer,
  summary: string,
): FileResult {
  return {
    output: summary,
    file: {
      filename,
      mimeType,
      contentBase64: buffer.toString('base64'),
    },
  }
}

export function toSafeFileStem(value: string, fallback = 'document'): string {
  const normalized = String(value)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || fallback
}

export function toPdfMetadataTitle(value: string): string {
  const ascii = String(value)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return ascii || 'Document Export'
}

export function getMimeTypeByExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case '.pdf':
      return 'application/pdf'
    case '.azw3':
      return 'application/vnd.amazon.mobi8-ebook'
    default:
      return 'application/octet-stream'
  }
}
