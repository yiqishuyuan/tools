import type { ToolHandler } from '../../shared/types.js'

const htmlEncodeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const htmlDecodeMap: Record<string, string> = Object.fromEntries(
  Object.entries(htmlEncodeMap).map(([key, value]) => [value, key]),
)

function encodeUnicode(input: string): string {
  return Array.from(input)
    .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('')
}

function decodeUnicode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  )
}

function textToAsciiCodes(input: string): number[] {
  return Array.from(input).map((char) => char.charCodeAt(0))
}

function asciiCodesToText(input: string): string {
  const codes = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((item) => Number(item))

  return String.fromCharCode(...codes)
}

function textToBinary(input: string): string {
  return Array.from(input)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ')
}

function textToHex(input: string): string {
  return Buffer.from(input, 'utf8').toString('hex')
}

function utf8Bytes(input: string): string {
  return [...Buffer.from(input, 'utf8')]
    .map((byte) => byte.toString(10))
    .join(' ')
}

export const encodingToolHandlers: Record<string, ToolHandler> = {
  'base64': (input, options) => {
    const mode = String(options?.mode ?? 'encode')
    return mode === 'decode'
      ? { output: Buffer.from(input as string, 'base64').toString('utf8') }
      : { output: Buffer.from(input as string, 'utf8').toString('base64') }
  },
  'url': (input, options) => {
    const mode = String(options?.mode ?? 'encode')
    return { output: mode === 'decode' ? decodeURIComponent(input as string) : encodeURIComponent(input as string) }
  },
  'html-entity': (input, options) => {
    const mode = String(options?.mode ?? 'encode')
    return mode === 'decode'
      ? { output: (input as string).replace(/&(amp|lt|gt|quot|#39);/g, (entity) => htmlDecodeMap[entity] ?? entity) }
      : { output: (input as string).replace(/[&<>"']/g, (char) => htmlEncodeMap[char] ?? char) }
  },
  // 兼容旧 id（若前端仍引用）
  'base64-encode': (input) => ({ output: Buffer.from(input as string, 'utf8').toString('base64') }),
  'base64-decode': (input) => ({ output: Buffer.from(input as string, 'base64').toString('utf8') }),
  'url-encode': (input) => ({ output: encodeURIComponent(input as string) }),
  'url-decode': (input) => ({ output: decodeURIComponent(input as string) }),
  'html-encode': (input) => ({
    output: (input as string).replace(/[&<>"']/g, (char) => htmlEncodeMap[char] ?? char),
  }),
  'html-decode': (input) => ({
    output: (input as string).replace(/&(amp|lt|gt|quot|#39);/g, (entity) => htmlDecodeMap[entity] ?? entity),
  }),
  'unicode-encode': (input) => ({ output: encodeUnicode(input as string) }),
  'unicode-decode': (input) => ({ output: decodeUnicode(input as string) }),
  'ascii-converter': (input) => ({ output: textToAsciiCodes(input as string) }),
  'string-escape-tool': (input) => ({ output: JSON.stringify(input).slice(1, -1) }),
  'binary-converter': (input) => ({ output: textToBinary(input as string) }),
  'hex-converter': (input) => ({ output: textToHex(input as string) }),
  'utf-8-converter': (input) => ({ output: utf8Bytes(input as string) }),
  'text-to-ascii': (input) => ({ output: textToAsciiCodes(input as string) }),
  'ascii-to-text': (input) => ({ output: asciiCodesToText(input as string) }),
}
