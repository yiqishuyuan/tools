import QRCode from 'qrcode'
import {
  checkHttpStatus,
  inspectHttpHeaders,
  parseHeaderText,
  sendHttpRequest,
} from '../../api/http'
import { executeBackendTool } from '../../api/tool'
import type { ToolDefinition } from '../toolCatalog'
import type { ToolExecutionPayload, ToolExecutionResult } from './types'

function asPrettyText(value: unknown) {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function textToBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToText(value: string) {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function unescapeHtml(value: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function toUnicode(value: string) {
  return Array.from(value)
    .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('')
}

function fromUnicode(value: string) {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  )
}

function toAscii(value: string) {
  return Array.from(value)
    .map((char) => char.charCodeAt(0))
    .join(' ')
}

function asciiToText(value: string) {
  const chars = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
  return String.fromCharCode(...chars)
}

function toBinary(value: string) {
  return Array.from(value)
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ')
}

function toHex(value: string) {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ')
}

function toUtf8Bytes(value: string) {
  return Array.from(new TextEncoder().encode(value)).join(' ')
}

type UploadedFileValue = {
  name: string
  type: string
  size: number
  contentBase64: string
}

function ensureUploadedFile(value: unknown, field = 'file'): UploadedFileValue {
  if (!value || typeof value !== 'object') {
    throw new Error(`请先选择${field === 'file' ? '文件' : field}`)
  }
  const file = value as UploadedFileValue
  if (!file.contentBase64) {
    throw new Error('文件内容为空，请重新选择')
  }
  return file
}

function dataUrlFromFile(file: UploadedFileValue): string {
  const mimeType = file.type || 'application/octet-stream'
  return `data:${mimeType};base64,${file.contentBase64}`
}

function baseName(filename: string): string {
  const index = filename.lastIndexOf('.')
  return index > 0 ? filename.slice(0, index) : filename
}

function extFromMimeType(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  return ''
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

async function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取图片，请确认文件格式'))
    image.src = dataUrl
  })
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

function fitContainSize(srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1)
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  }
}

function drawWithFit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  fit: 'contain' | 'cover' | 'fill',
) {
  if (fit === 'fill') {
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
    return
  }
  const scale =
    fit === 'cover'
      ? Math.max(targetWidth / image.width, targetHeight / image.height)
      : Math.min(targetWidth / image.width, targetHeight / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const offsetX = (targetWidth - drawWidth) / 2
  const offsetY = (targetHeight - drawHeight) / 2
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
}

function shortHash(value: string, length: number): string {
  const source = value || `${Date.now()}-${Math.random()}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) | 0
  }
  const text = Math.abs(hash).toString(36)
  if (text.length >= length) return text.slice(0, length)
  return (text + Math.random().toString(36).slice(2)).slice(0, length)
}

function normalizeObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeObjectKeys)
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (accumulator, [key, item]) => {
        accumulator[key] = normalizeObjectKeys(item)
        return accumulator
      },
      {},
    )
  }
  return value
}

function jsonToCsv(value: unknown) {
  const rows = Array.isArray(value) ? value : [value]
  if (rows.length === 0) return ''
  const headers = [...new Set(rows.flatMap((row) => Object.keys((row as Record<string, unknown>) ?? {})))]
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    const cells = headers.map((header) => {
      const raw = (row as Record<string, unknown>)?.[header]
      if (raw === undefined || raw === null) return ''
      const text = typeof raw === 'object' ? JSON.stringify(raw) : String(raw)
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    })
    lines.push(cells.join(','))
  })
  return lines.join('\n')
}

function csvToJson(value: string) {
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rows.length === 0) return []

  const parseLine = (line: string) => {
    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      const next = line[index + 1]

      if (char === '"' && inQuotes && next === '"') {
        current += '"'
        index += 1
        continue
      }

      if (char === '"') {
        inQuotes = !inQuotes
        continue
      }

      if (char === ',' && !inQuotes) {
        cells.push(current)
        current = ''
        continue
      }

      current += char
    }

    cells.push(current)
    return cells
  }

  const headers = parseLine(rows[0])
  return rows.slice(1).map((row) => {
    const values = parseLine(row)
    return headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? ''
      return accumulator
    }, {})
  })
}

function valueToXml(doc: XMLDocument, key: string, value: unknown): Element {
  const element = doc.createElement(key)

  if (Array.isArray(value)) {
    value.forEach((item) => {
      element.appendChild(valueToXml(doc, 'item', item))
    })
    return element
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      element.appendChild(valueToXml(doc, childKey, childValue))
    })
    return element
  }

  element.textContent = value == null ? '' : String(value)
  return element
}

function jsonToXml(value: unknown) {
  const doc = document.implementation.createDocument('', '', null)
  const root = valueToXml(doc, 'root', value)
  doc.appendChild(root)
  return new XMLSerializer().serializeToString(doc)
}

function xmlNodeToJson(node: Element): unknown {
  if (node.children.length === 0) {
    return node.textContent ?? ''
  }

  const children = Array.from(node.children)
  const grouped = children.reduce<Record<string, unknown[]>>((accumulator, child) => {
    accumulator[child.nodeName] ??= []
    accumulator[child.nodeName].push(xmlNodeToJson(child))
    return accumulator
  }, {})

  return Object.entries(grouped).reduce<Record<string, unknown>>((accumulator, [key, items]) => {
    accumulator[key] = items.length === 1 ? items[0] : items
    return accumulator
  }, {})
}

function xmlToJson(value: string) {
  const doc = new DOMParser().parseFromString(value, 'application/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    throw new Error('XML 解析失败')
  }
  const root = doc.documentElement
  return { [root.nodeName]: xmlNodeToJson(root) }
}

function toYaml(value: unknown, indent = 0): string {
  const spacing = '  '.repeat(indent)

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          return `${spacing}-\n${toYaml(item, indent + 1)}`
        }
        return `${spacing}- ${String(item)}`
      })
      .join('\n')
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        if (item && typeof item === 'object') {
          return `${spacing}${key}:\n${toYaml(item, indent + 1)}`
        }
        return `${spacing}${key}: ${item == null ? '' : String(item)}`
      })
      .join('\n')
  }

  return `${spacing}${String(value ?? '')}`
}

function yamlToJson(value: string) {
  const lines = value.split(/\r?\n/).filter((line) => line.trim())
  const root: Record<string, unknown> = {}
  const stack: Array<{ indent: number; target: Record<string, unknown> }> = [{ indent: -1, target: root }]

  lines.forEach((line) => {
    const indent = line.match(/^\s*/)?.[0].length ?? 0
    const trimmed = line.trim()
    const [keyPart, ...rest] = trimmed.split(':')
    const rawValue = rest.join(':').trim()

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    const current = stack[stack.length - 1].target
    if (!rawValue) {
      current[keyPart.trim()] = {}
      stack.push({ indent, target: current[keyPart.trim()] as Record<string, unknown> })
      return
    }

    current[keyPart.trim()] = rawValue
  })

  return root
}

function resolveJsonPath(value: unknown, path: string) {
  if (!path || path === '$') return value
  return path
    .replace(/^\$\./, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, token) => {
      if (current == null) return undefined
      const key = Number.isNaN(Number(token)) ? token : Number(token)
      return (current as Record<string | number, unknown>)[key]
    }, value)
}

function compareJson(left: string, right: string) {
  const leftParsed = normalizeObjectKeys(JSON.parse(left))
  const rightParsed = normalizeObjectKeys(JSON.parse(right))
  return {
    equal: JSON.stringify(leftParsed) === JSON.stringify(rightParsed),
    left: leftParsed,
    right: rightParsed,
  }
}

function diffLines(left: string, right: string) {
  const leftLines = left.split(/\r?\n/)
  const rightLines = right.split(/\r?\n/)
  const removed = leftLines.filter((line) => !rightLines.includes(line))
  const added = rightLines.filter((line) => !leftLines.includes(line))
  const common = leftLines.filter((line) => rightLines.includes(line))
  return { added, removed, common }
}

async function digestText(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', value: string) {
  const buffer = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacText(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function aesEncrypt(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value),
  )
  const merged = new Uint8Array(iv.length + encrypted.byteLength)
  merged.set(iv, 0)
  merged.set(new Uint8Array(encrypted), iv.length)
  let binary = ''
  merged.forEach((item) => {
    binary += String.fromCharCode(item)
  })
  return btoa(binary)
}

async function aesDecrypt(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const raw = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
  const iv = raw.slice(0, 12)
  const data = raw.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

function generatePassword(length: number, includeSymbols: boolean) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' +
    (includeSymbols ? '!@#$%^&*()_+-=[]{}' : '')
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((byte) => chars[byte % chars.length])
    .join('')
}

function passwordStrength(value: string, minLength: number) {
  let score = 0
  if (value.length >= Math.max(minLength, 8)) score += 1
  if (value.length >= Math.max(minLength + 4, 12)) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  return {
    score,
    label: labels[score],
    length: value.length,
  }
}

async function requestTool(url: string, options: Record<string, unknown>) {
  return sendHttpRequest({
    url,
    method: String(options.method || 'GET').toUpperCase() as
      | 'GET'
      | 'POST'
      | 'PUT'
      | 'DELETE'
      | 'PATCH'
      | 'HEAD'
      | 'OPTIONS',
    headers: parseHeaderText(String(options.headers || '')),
    body: String(options.body || ''),
  })
}

function parseUserAgent(value: string) {
  const ua = value.toLowerCase()
  const browser =
    ua.includes('edg/')
      ? 'Edge'
      : ua.includes('chrome/')
        ? 'Chrome'
        : ua.includes('firefox/')
          ? 'Firefox'
          : ua.includes('safari/') && !ua.includes('chrome/')
            ? 'Safari'
            : 'Unknown'
  const os =
    ua.includes('windows')
      ? 'Windows'
      : ua.includes('mac os x')
        ? 'macOS'
        : ua.includes('android')
          ? 'Android'
          : ua.includes('iphone') || ua.includes('ipad')
            ? 'iOS'
            : 'Unknown'
  const device = /mobile|iphone|android/.test(ua) ? 'Mobile' : 'Desktop'
  return { browser, os, device, raw: value }
}

function convertTimestamp(value: string, mode: string) {
  const isNumeric = /^\d{10,13}$/.test(value.trim())
  if (mode === 'date-to-timestamp' || (!isNumeric && mode === 'auto')) {
    const date = new Date(value)
    return {
      milliseconds: date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      iso: date.toISOString(),
    }
  }
  const raw = Number(value)
  const milliseconds = String(raw).length === 10 ? raw * 1000 : raw
  return {
    milliseconds,
    seconds: Math.floor(milliseconds / 1000),
    iso: new Date(milliseconds).toISOString(),
  }
}

function curlToRequest(value: string) {
  const url = value.match(/https?:\/\/[^\s'"]+/)?.[0] ?? ''
  const method = value.match(/-X\s+([A-Z]+)/i)?.[1]?.toUpperCase() ?? 'GET'
  const headers = [...value.matchAll(/-H\s+["']([^"']+)["']/g)].map((match) => match[1])
  const body = value.match(/(?:--data|-d)\s+["']([\s\S]*?)["']/)?.[1] ?? ''
  return { url, method, headers, body }
}

function formatSql(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(
      /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|LIMIT)\b/gi,
      '\n$1',
    )
    .trim()
}

function minifySql(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sqlToJson(value: string) {
  const sql = minifySql(value)
  const match = sql.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i)
  if (!match) {
    throw new Error('当前只支持简单 INSERT INTO ... VALUES ... 语句')
  }
  const columns = match[1].split(',').map((item) => item.trim())
  const values = match[2]
    .split(',')
    .map((item) => item.trim().replace(/^'|'$/g, ''))
  return columns.reduce<Record<string, string>>((accumulator, column, index) => {
    accumulator[column] = values[index] ?? ''
    return accumulator
  }, {})
}

function jsonToSql(value: string, tableName: string) {
  const parsed = JSON.parse(value)
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  if (rows.length === 0) return ''
  const columns = Object.keys(rows[0] as Record<string, unknown>)
  const lines = rows.map((row) => {
    const values = columns.map((column) => {
      const item = (row as Record<string, unknown>)[column]
      if (item === null || item === undefined) return 'NULL'
      if (typeof item === 'number' || typeof item === 'boolean') return String(item)
      return `'${String(item).replace(/'/g, "''")}'`
    })
    return `(${values.join(', ')})`
  })
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${lines.join(',\n')};`
}

function sqlSchemaFromJson(value: string, tableName: string, dialect: string) {
  const def = JSON.parse(value) as Record<string, string>
  const lines = Object.entries(def).map(([col, type]) => {
    const t = (type || '').toLowerCase()
    let sqlType = type
    if (dialect === 'mysql') {
      if (t === 'int' || t === 'integer') sqlType = 'INT'
      else if (t.startsWith('varchar')) sqlType = t.replace('varchar', 'VARCHAR').toUpperCase()
      else if (t === 'text') sqlType = 'TEXT'
      else if (t === 'datetime' || t === 'date') sqlType = 'DATETIME'
      else if (t === 'bool' || t === 'boolean') sqlType = 'TINYINT(1)'
      else if (t === 'float' || t === 'double') sqlType = 'DOUBLE'
    } else if (dialect === 'postgresql') {
      if (t === 'int' || t === 'integer') sqlType = 'INTEGER'
      else if (t.startsWith('varchar')) sqlType = t.replace('varchar', 'VARCHAR').toUpperCase()
      else if (t === 'text') sqlType = 'TEXT'
      else if (t === 'datetime' || t === 'date') sqlType = 'TIMESTAMP'
      else if (t === 'bool' || t === 'boolean') sqlType = 'BOOLEAN'
      else if (t === 'float' || t === 'double') sqlType = 'DOUBLE PRECISION'
    } else {
      if (t === 'int' || t === 'integer') sqlType = 'INTEGER'
      else if (t.startsWith('varchar')) sqlType = t.replace('varchar', 'VARCHAR').toUpperCase()
      else if (t === 'text') sqlType = 'TEXT'
      else if (t === 'datetime' || t === 'date') sqlType = 'DATETIME'
      else if (t === 'bool' || t === 'boolean') sqlType = 'INTEGER'
      else if (t === 'float' || t === 'double') sqlType = 'REAL'
    }
    return `  ${col} ${sqlType}`
  })
  return `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`
}

function mongoQueryFormat(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const obj = JSON.parse(trimmed)
    return JSON.stringify(obj, null, 2)
  } catch {
    return '当前仅支持 JSON 形式的 MongoDB 查询对象，请检查输入是否为合法 JSON。'
  }
}

function convertCase(value: string, mode: string) {
  const words = value.trim().split(/[\s_-]+/).filter(Boolean)
  const forms = {
    lower: value.toLowerCase(),
    upper: value.toUpperCase(),
    title: value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase()),
    camel:
      words[0]?.toLowerCase() +
        words
          .slice(1)
          .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
          .join('') || '',
    snake: words.map((word) => word.toLowerCase()).join('_'),
    kebab: words.map((word) => word.toLowerCase()).join('-'),
  }
  return mode === 'all' ? forms : forms[mode as keyof typeof forms]
}

function randomText(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((byte) => chars[byte % chars.length])
    .join('')
}

function lorem(paragraphs: number) {
  const text =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  return Array.from({ length: paragraphs }, () => text).join('\n\n')
}

const SURNAMES_CN = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗']
const GIVEN_CN = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '军', '杰', '娟', '艳', '涛', '明', '超', '秀英', '华', '平', '丽']
const SURNAMES_EN = ['James', 'John', 'Robert', 'Michael', 'William', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth']
const GIVEN_EN = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']

function randomName(locale: 'zh' | 'en' | 'mixed', count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (locale === 'zh') {
      out.push(SURNAMES_CN[Math.floor(Math.random() * SURNAMES_CN.length)] + GIVEN_CN[Math.floor(Math.random() * GIVEN_CN.length)])
    } else if (locale === 'en') {
      out.push(SURNAMES_EN[Math.floor(Math.random() * SURNAMES_EN.length)] + ' ' + GIVEN_EN[Math.floor(Math.random() * GIVEN_EN.length)])
    } else {
      out.push(Math.random() > 0.5
        ? SURNAMES_CN[Math.floor(Math.random() * SURNAMES_CN.length)] + GIVEN_CN[Math.floor(Math.random() * GIVEN_CN.length)]
        : SURNAMES_EN[Math.floor(Math.random() * SURNAMES_EN.length)] + ' ' + GIVEN_EN[Math.floor(Math.random() * GIVEN_EN.length)])
    }
  }
  return out
}

function randomJson(count: number, keysStr: string): unknown[] {
  const keys = keysStr.split(/[\s,]+/).map((k) => k.trim()).filter(Boolean)
  if (keys.length === 0) keys.push('id', 'name', 'value')
  const types: Record<string, () => unknown> = {
    string: () => Math.random().toString(36).slice(2, 10),
    number: () => Math.floor(Math.random() * 10000),
    int: () => Math.floor(Math.random() * 1000),
    boolean: () => Math.random() > 0.5,
    bool: () => Math.random() > 0.5,
    date: () => new Date(Date.now() - Math.random() * 1e10).toISOString().slice(0, 10),
  }
  return Array.from({ length: Math.min(Math.max(count, 1), 100) }, (_, i) => {
    const obj: Record<string, unknown> = {}
    keys.forEach((key) => {
      const [name, typeKey] = key.includes(':') ? key.split(':').map((s) => s.trim()) : [key, 'string']
      obj[name] = types[typeKey]?.() ?? types.string()
    })
    if (!keys.some((k) => k.startsWith('id'))) obj.id = i + 1
    return obj
  })
}

function convertFileSize(value: string, fromUnit: string) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const numeric = Number(value)
  const index = Math.max(units.indexOf(fromUnit), 0)
  const bytes = numeric * 1024 ** index
  return units.reduce<Record<string, number>>((accumulator, unit, currentIndex) => {
    accumulator[unit] = Number((bytes / 1024 ** currentIndex).toFixed(4))
    return accumulator
  }, {})
}

function countWorkingDays(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let total = 0
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const weekDay = day.getDay()
    if (weekDay !== 0 && weekDay !== 6) {
      total += 1
    }
  }
  return total
}

function randomDate(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const value = start + Math.random() * (end - start)
  return new Date(value).toISOString()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseHexColor(value: string) {
  const raw = value.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) {
    throw new Error('请输入合法的 HEX 颜色，例如 #409EFF 或 #09f')
  }
  const hex =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (component: number) =>
    clamp(Math.round(component), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function parseRgb(input: string) {
  const match = input
    .replace(/\s+/g, '')
    .match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i)
  if (!match) {
    throw new Error('请输入合法的 rgb() 颜色，例如 rgb(64,158,255)')
  }
  const [, rs, gs, bs] = match
  const r = clamp(Number(rs), 0, 255)
  const g = clamp(Number(gs), 0, 255)
  const b = clamp(Number(bs), 0, 255)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  let rr = r / 255
  let gg = g / 255
  let bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0)
        break
      case gg:
        h = (bb - rr) / d + 2
        break
      case bb:
        h = (rr - gg) / d + 4
        break
      default:
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(h: number, s: number, l: number) {
  let hh = h / 360
  let ss = s / 100
  let ll = l / 100

  if (ss === 0) {
    const gray = Math.round(ll * 255)
    return { r: gray, g: gray, b: gray }
  }

  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const hue2rgb = (p2: number, q2: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p2 + (q2 - p2) * 6 * tt
    if (tt < 1 / 2) return q2
    if (tt < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - tt) * 6
    return p2
  }

  const r = hue2rgb(p, q, hh + 1 / 3)
  const g = hue2rgb(p, q, hh)
  const b = hue2rgb(p, q, hh - 1 / 3)

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function randomColorHex() {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return rgbToHex(r, g, b)
}

function convertLength(value: number, fromUnit: string, toUnit: string) {
  const factors: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  }
  const from = factors[fromUnit]
  const to = factors[toUnit]
  if (!from || !to) throw new Error('不支持的长度单位')
  const meters = value * from
  return meters / to
}

function convertWeight(value: number, fromUnit: string, toUnit: string) {
  const factors: Record<string, number> = {
    g: 0.001,
    kg: 1,
    t: 1000,
    lb: 0.45359237,
    oz: 0.0283495231,
  }
  const from = factors[fromUnit]
  const to = factors[toUnit]
  if (!from || !to) throw new Error('不支持的重量单位')
  const kg = value * from
  return kg / to
}

function convertTemperature(value: number, fromUnit: string, toUnit: string) {
  if (fromUnit === toUnit) return value
  let celsius: number
  if (fromUnit === 'C') celsius = value
  else if (fromUnit === 'F') celsius = ((value - 32) * 5) / 9
  else if (fromUnit === 'K') celsius = value - 273.15
  else throw new Error('不支持的温度单位')

  if (toUnit === 'C') return celsius
  if (toUnit === 'F') return (celsius * 9) / 5 + 32
  if (toUnit === 'K') return celsius + 273.15
  throw new Error('不支持的温度单位')
}

function convertSpeed(value: number, fromUnit: string, toUnit: string) {
  const factors: Record<string, number> = {
    'm/s': 1,
    'km/h': 1000 / 3600,
    mph: 0.44704,
    knot: 0.514444,
  }
  const from = factors[fromUnit]
  const to = factors[toUnit]
  if (!from || !to) throw new Error('不支持的速度单位')
  const ms = value * from
  return ms / to
}

function convertDataSize(value: number, fromUnit: string, toUnit: string) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const fromIndex = units.indexOf(fromUnit)
  const toIndex = units.indexOf(toUnit)
  if (fromIndex === -1 || toIndex === -1) throw new Error('不支持的数据单位')
  const bytes = value * 1024 ** fromIndex
  return bytes / 1024 ** toIndex
}

function convertEnergy(value: number, fromUnit: string, toUnit: string) {
  const factors: Record<string, number> = {
    J: 1,
    kJ: 1000,
    cal: 4.184,
    kcal: 4184,
    Wh: 3600,
    kWh: 3_600_000,
  }
  const from = factors[fromUnit]
  const to = factors[toUnit]
  if (!from || !to) throw new Error('不支持的能量单位')
  const joule = value * from
  return joule / to
}

function convertAngle(value: number, fromUnit: string, toUnit: string) {
  if (fromUnit === toUnit) return value
  if (fromUnit === 'deg' && toUnit === 'rad') return (value * Math.PI) / 180
  if (fromUnit === 'rad' && toUnit === 'deg') return (value * 180) / Math.PI
  throw new Error('不支持的角度单位')
}

function randomInt(min: number, max: number) {
  const a = Math.ceil(min)
  const b = Math.floor(max)
  return Math.floor(Math.random() * (b - a + 1)) + a
}

function randomStringByCharset(length: number, charset: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map((byte) => charset[byte % charset.length])
    .join('')
}

function randomNanoId(length = 21) {
  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-'
  return randomStringByCharset(length, alphabet)
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function decodeJwt(value: string) {
  const parts = value.split('.')
  if (parts.length < 2) {
    throw new Error('JWT 格式不正确，至少需要 header.payload')
  }
  const [rawHeader, rawPayload, rawSignature] = parts
  const header = JSON.parse(decodeBase64Url(rawHeader))
  const payload = JSON.parse(decodeBase64Url(rawPayload))
  const signature = rawSignature || ''
  return { header, payload, signature }
}

function lookupHttpStatus(code: number) {
  const map: Record<number, string> = {
    200: 'OK（成功）',
    201: 'Created（已创建）',
    204: 'No Content（无内容）',
    301: 'Moved Permanently（永久重定向）',
    302: 'Found / Temporary Redirect（临时重定向）',
    304: 'Not Modified（未修改）',
    400: 'Bad Request（错误请求）',
    401: 'Unauthorized（未认证）',
    403: 'Forbidden（无权限）',
    404: 'Not Found（未找到）',
    408: 'Request Timeout（请求超时）',
    429: 'Too Many Requests（请求过多）',
    500: 'Internal Server Error（服务器内部错误）',
    502: 'Bad Gateway（网关错误）',
    503: 'Service Unavailable（服务不可用）',
    504: 'Gateway Timeout（网关超时）',
  }
  return {
    code,
    message: map[code] || '未知状态码，可能是自定义或较少见的状态。',
  }
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function extractDomain(value: string) {
  const url = new URL(value)
  const host = url.hostname
  const parts = host.split('.')
  const domain =
    parts.length <= 2 ? host : parts.slice(parts.length - 2).join('.')
  return {
    href: url.href,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    domain,
  }
}

function formatLogs(value: string) {
  const raw = typeof value === 'string' ? value : ''
  const lines = raw.split(/\r?\n/)
  const formatted = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    try {
      const json = JSON.parse(trimmed)
      return JSON.stringify(json, null, 2)
    } catch {
      return trimmed
    }
  })
  return formatted.join('\n')
}

function analyzeLogs(value: string) {
  const raw = typeof value === 'string' ? value : ''
  const lines = raw.split(/\r?\n/).filter((line) => line.trim())
  const summary: Record<string, number> = {}
  const examples: Record<string, string> = {}

  lines.forEach((line) => {
    const trimmed = line.trim()
    let level = 'UNKNOWN'
    try {
      const json = JSON.parse(trimmed)
      level =
        (json.level as string) ||
        (json.severity as string) ||
        (json.logLevel as string) ||
        'UNKNOWN'
    } catch {
      const match = trimmed.match(
        /\b(DEBUG|INFO|WARN|ERROR|TRACE|FATAL)\b/i,
      )
      if (match) {
        level = match[1].toUpperCase()
      }
    }

    if (!summary[level]) {
      summary[level] = 0
      examples[level] = trimmed
    }
    summary[level] += 1
  })

  return {
    totalLines: lines.length,
    levels: summary,
    examples,
  }
}

function parseStackTrace(value: string) {
  const raw = typeof value === 'string' ? value : ''
  const lines = raw.split(/\r?\n/)
  const header = lines[0] ?? ''
  const frames = lines
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '))
    .map((line) => {
      const withoutAt = line.replace(/^at\s+/, '')
      const match = withoutAt.match(/^(.*?)\s+\((.*):(\d+):(\d+)\)$/)
      if (match) {
        const [, fn, file, lineNumber, columnNumber] = match
        return {
          function: fn,
          file,
          line: Number(lineNumber),
          column: Number(columnNumber),
          raw: line,
        }
      }
      const inlineMatch = withoutAt.match(/^(.*):(\d+):(\d+)$/)
      if (inlineMatch) {
        const [, file, lineNumber, columnNumber] = inlineMatch
        return {
          function: '<anonymous>',
          file,
          line: Number(lineNumber),
          column: Number(columnNumber),
          raw: line,
        }
      }
      return {
        function: '<unknown>',
        file: withoutAt,
        line: 0,
        column: 0,
        raw: line,
      }
    })

  return {
    header,
    frames,
  }
}

function buildGitIgnore(targetsRaw: string) {
  const targets = targetsRaw
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const blocks: Record<string, string> = {
    node: ['node_modules/', 'npm-debug.log*', 'yarn.lock', 'dist/', 'coverage/'].join('\n'),
    react: ['build/', '.cache/', '*.log'].join('\n'),
    windows: ['Thumbs.db', 'Desktop.ini', '$RECYCLE.BIN/'].join('\n'),
    macos: ['.DS_Store', '.AppleDouble', '.LSOverride'].join('\n'),
    vscode: ['.vscode/'].join('\n'),
    jetbrains: ['.idea/'].join('\n'),
  }

  const picked = targets.length ? targets : ['node']
  const lines: string[] = []

  picked.forEach((target) => {
    const block = blocks[target]
    if (block) {
      lines.push(`# ${target}`, block, '')
    }
  })

  if (lines.length === 0) {
    lines.push('# 默认忽略 node_modules', 'node_modules/')
  }

  return lines.join('\n')
}

function analyzeGitDiff(value: string) {
  const lines = value.split(/\r?\n/)
  let added = 0
  let removed = 0
  lines.forEach((line) => {
    if (line.startsWith('+++') || line.startsWith('---')) return
    if (line.startsWith('+')) added += 1
    else if (line.startsWith('-')) removed += 1
  })
  return { added, removed, total: lines.length }
}

function formatHtml(value: string) {
  const tokens = value
    .replace(/>\s+</g, '><')
    .replace(/</g, '\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let indent = 0
  const lines: string[] = []

  tokens.forEach((line) => {
    if (/^<\/.+>/.test(line) || /^<\//.test(line)) {
      indent = Math.max(indent - 1, 0)
    }

    lines.push(`${'  '.repeat(indent)}${line}`)

    if (
      /^<[^/!][^>]*>/.test(line) &&
      !/\/>$/.test(line) &&
      !/^<meta/i.test(line) &&
      !/^<link/i.test(line) &&
      !/^<img/i.test(line) &&
      !/^<input/i.test(line)
    ) {
      indent += 1
    }
  })

  return lines.join('\n')
}

function minifyHtml(value: string) {
  return value
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*(<[^>]+>)\s*/g, '$1')
    .trim()
}

function formatCss(value: string) {
  return value
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function minifyCss(value: string) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

function formatJs(value: string) {
  return value
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function minifyJs(value: string) {
  return value
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([{}();,:+\-*/%=<>]|&&|\|\|)\s*/g, '$1')
    .trim()
}

function cssToJsObject(value: string) {
  const result: Record<string, Record<string, string>> = {}
  const blocks = value.split('}').map((block) => block.trim())

  blocks.forEach((block) => {
    if (!block) return
    const parts = block.split('{')
    if (parts.length < 2) return
    const selector = parts[0]?.trim()
    const body = parts[1]?.trim()
    if (!selector || !body) return

    const rules: Record<string, string> = {}
    body.split(';').forEach((line) => {
      const [prop, val] = line.split(':')
      if (!prop || !val) return
      const jsKey = prop
        .trim()
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      rules[jsKey] = val.trim()
    })

    if (Object.keys(rules).length > 0) {
      result[selector] = rules
    }
  })

  return result
}

function markdownToHtml(value: string) {
  let html = value
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  html = html.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  html = html.replace(/\n{2,}/g, '\n\n')
  html = html.replace(/(^|\n)([^<\n][^\n]*)/g, (match, prefix, text) => {
    if (!text.trim()) return match
    if (/^<h[1-6]>/.test(text) || /^<ul>/.test(text)) return match
    return `${prefix}<p>${text}</p>`
  })
  return html.trim()
}

function stripHtmlTags(value: string) {
  return value.replace(/<\/?[^>]+>/g, '')
}

function htmlToMarkdown(value: string) {
  let markdown = value
  markdown = markdown.replace(/<\/h1>/gi, '\n\n').replace(/<h1[^>]*>/gi, '# ')
  markdown = markdown.replace(/<\/h2>/gi, '\n\n').replace(/<h2[^>]*>/gi, '## ')
  markdown = markdown.replace(/<\/h3>/gi, '\n\n').replace(/<h3[^>]*>/gi, '### ')
  markdown = markdown.replace(/<\/h4>/gi, '\n\n').replace(/<h4[^>]*>/gi, '#### ')
  markdown = markdown.replace(/<\/h5>/gi, '\n\n').replace(/<h5[^>]*>/gi, '##### ')
  markdown = markdown.replace(/<\/h6>/gi, '\n\n').replace(/<h6[^>]*>/gi, '###### ')
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  markdown = markdown.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  markdown = markdown.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '')
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  markdown = markdown.replace(/<\/?ul[^>]*>/gi, '')
  markdown = stripHtmlTags(markdown)
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  return markdown.trim()
}

function generateMarkdownTable(columnsRaw: string, rowCount: number) {
  const columns = columnsRaw
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (columns.length === 0) return ''

  const header = `| ${columns.join(' | ')} |`
  const separator = `| ${columns.map(() => '---').join(' | ')} |`
  const rows = Array.from({ length: rowCount }, () => `| ${columns.map(() => '').join(' | ')} |`)
  return [header, separator, ...rows].join('\n')
}

function markdownCheatSheet() {
  return [
    '# 标题',
    '## 二级标题',
    '### 三级标题',
    '',
    '- 无序列表项',
    '1. 有序列表项',
    '',
    '**加粗** 和 *斜体*',
    '',
    '`行内代码` 与代码块：',
    '```js',
    "console.log('hello markdown')",
    '```',
    '',
    '[链接文本](https://example.com)',
    '',
    '| 列1 | 列2 |',
    '| --- | --- |',
    '| A   | B   |',
  ].join('\n')
}

export async function executeTool(
  tool: ToolDefinition,
  payload: ToolExecutionPayload,
): Promise<ToolExecutionResult> {
  const { input, secondaryInput, options } = payload

  if (!tool.frontend) {
    return executeBackendTool(tool, payload)
  }

  if (tool.mode === 'placeholder') {
    return { output: `${tool.name} 暂未实现。` }
  }

  switch (tool.id) {
    case 'json-formatter':
    case 'json-pretty-print':
    case 'json-viewer':
      return { output: JSON.stringify(JSON.parse(input), null, 2) }
    case 'json-validator':
      return { output: asPrettyText({ valid: true, parsed: JSON.parse(input) }) }
    case 'json-minify':
      return { output: JSON.stringify(JSON.parse(input)) }
    case 'json-xml-converter':
    case 'json-to-xml':
    case 'xml-to-json': {
      const mode =
        tool.id === 'json-to-xml'
          ? 'json-to-xml'
          : tool.id === 'xml-to-json'
            ? 'xml-to-json'
            : String(options.mode || 'json-to-xml')
      return mode === 'xml-to-json'
        ? { output: asPrettyText(xmlToJson(input)) }
        : { output: jsonToXml(JSON.parse(input)) }
    }
    case 'json-csv-converter':
    case 'json-to-csv':
    case 'csv-to-json': {
      const mode =
        tool.id === 'json-to-csv'
          ? 'json-to-csv'
          : tool.id === 'csv-to-json'
            ? 'csv-to-json'
            : String(options.mode || 'json-to-csv')
      return mode === 'csv-to-json'
        ? { output: asPrettyText(csvToJson(input)) }
        : { output: jsonToCsv(JSON.parse(input)) }
    }
    case 'json-yaml-converter':
    case 'json-to-yaml':
    case 'yaml-to-json': {
      const mode =
        tool.id === 'json-to-yaml'
          ? 'json-to-yaml'
          : tool.id === 'yaml-to-json'
            ? 'yaml-to-json'
            : String(options.mode || 'json-to-yaml')
      return mode === 'yaml-to-json'
        ? { output: asPrettyText(yamlToJson(input)) }
        : { output: toYaml(JSON.parse(input)) }
    }
    case 'json-compare':
      return { output: asPrettyText(compareJson(input, secondaryInput)) }
    case 'json-diff-tool':
      return {
        output: asPrettyText(
          diffLines(
            JSON.stringify(JSON.parse(input), null, 2),
            JSON.stringify(JSON.parse(secondaryInput), null, 2),
          ),
        ),
      }
    case 'json-path-tester':
      return {
        output: asPrettyText(resolveJsonPath(JSON.parse(input), String(options.path || '$'))),
      }
    case 'json-escape-unescape':
      return {
        output:
          options.mode === 'unescape'
            ? JSON.parse(`"${input.replace(/"/g, '\\"')}"`)
            : JSON.stringify(input).slice(1, -1),
      }

    case 'base64':
      return {
        output: String(options.mode) === 'decode' ? base64ToText(input) : textToBase64(input),
      }
    case 'url':
      return {
        output: String(options.mode) === 'decode' ? decodeURIComponent(input) : encodeURIComponent(input),
      }
    case 'html-entity':
      return {
        output: String(options.mode) === 'decode' ? unescapeHtml(input) : escapeHtml(input),
      }
    case 'unicode-converter':
    case 'unicode-encode':
    case 'unicode-decode': {
      const mode =
        tool.id === 'unicode-encode'
          ? 'encode'
          : tool.id === 'unicode-decode'
            ? 'decode'
            : String(options.mode || 'encode')
      return { output: mode === 'decode' ? fromUnicode(input) : toUnicode(input) }
    }
    case 'ascii-converter':
    case 'text-to-ascii':
    case 'ascii-to-text': {
      const mode =
        tool.id === 'text-to-ascii'
          ? 'encode'
          : tool.id === 'ascii-to-text'
            ? 'decode'
            : String(options.mode || 'encode')
      return { output: mode === 'decode' ? asciiToText(input) : toAscii(input) }
    }
    case 'string-escape-tool':
      return { output: JSON.stringify(input).slice(1, -1) }
    case 'binary-converter':
      return { output: toBinary(input) }
    case 'hex-converter':
      return { output: toHex(input) }
    case 'utf-8-converter':
      return { output: toUtf8Bytes(input) }

    case 'md5-generator':
      return { output: 'MD5 浏览器原生不支持，后续接入 back_end 处理。' }
    case 'sha1-generator':
      return { output: await digestText('SHA-1', input) }
    case 'sha256-generator':
      return { output: await digestText('SHA-256', input) }
    case 'sha512-generator':
      return { output: await digestText('SHA-512', input) }
    case 'hmac-generator':
      return {
        output: await hmacText(
          String(options.algorithm || 'SHA-256') as 'SHA-1' | 'SHA-256' | 'SHA-512',
          String(options.secret || ''),
          input,
        ),
      }
    case 'aes-crypto-converter':
    case 'aes-encrypt':
    case 'aes-decrypt': {
      const mode =
        tool.id === 'aes-encrypt'
          ? 'encrypt'
          : tool.id === 'aes-decrypt'
            ? 'decrypt'
            : String(options.mode || 'encrypt')
      return {
        output:
          mode === 'decrypt'
            ? await aesDecrypt(input, String(options.secret || ''))
            : await aesEncrypt(input, String(options.secret || '')),
      }
    }
    case 'password-generator':
      return {
        output: generatePassword(
          Number(options.length || 16),
          Boolean(options.includeSymbols ?? true),
        ),
      }
    case 'password-strength-checker':
      return {
        output: asPrettyText(passwordStrength(input, Number(options.minLength || 12))),
      }

    case 'regex-tester': {
      const regex = new RegExp(String(options.pattern || ''), String(options.flags || 'g'))
      const matches = Array.from(input.matchAll(regex)).map((match) => ({
        value: match[0],
        index: match.index,
        groups: match.slice(1),
      }))
      return { output: asPrettyText(matches) }
    }
    case 'regex-generator': {
      const preset = String(options.preset || 'email')
      const flags = String(options.flags || '').trim()
      const min = Math.max(1, Number(options.min || 1))
      const max = Math.max(min, Number(options.max || 16))
      const allowUpper = Boolean(options.allowUpper ?? true)
      const allowLower = Boolean(options.allowLower ?? true)
      const allowDigits = Boolean(options.allowDigits ?? true)
      const allowUnderscore = Boolean(options.allowUnderscore ?? false)

      let pattern = ''
      if (preset === 'email') pattern = '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
      else if (preset === 'phone-cn') pattern = '^1[3-9]\\d{9}$'
      else if (preset === 'url') pattern = '^https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+(?:[\\w\\-._~:/?#[\\]@!$&\'()*+,;=.]+)?$'
      else if (preset === 'ipv4') pattern = '^(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}$'
      else if (preset === 'digits') pattern = '^\\d+$'
      else if (preset === 'username') pattern = '^[A-Za-z][A-Za-z0-9_]{2,31}$'
      else {
        const classes = [
          allowUpper ? 'A-Z' : '',
          allowLower ? 'a-z' : '',
          allowDigits ? '0-9' : '',
          allowUnderscore ? '_' : '',
        ].join('')
        if (!classes) {
          throw new Error('自定义模式至少需要勾选一种字符类型')
        }
        pattern = `^[${classes}]{${min},${max}}$`
      }

      const expression = `/${pattern}/${flags}`
      return {
        output: asPrettyText({
          preset,
          regex: expression,
          source: pattern,
          flags,
        }),
        copyText: expression,
      }
    }
    case 'http-request-tester':
    case 'api-tester':
      return { output: asPrettyText(await requestTool(input, options)) }
    case 'http-header-checker': {
      return {
        output: asPrettyText(await inspectHttpHeaders(input)),
      }
    }
    case 'user-agent-parser':
      return { output: asPrettyText(parseUserAgent(input)) }
    case 'uuid-generator':
      return { output: crypto.randomUUID() }
    case 'timestamp-converter':
      return { output: asPrettyText(convertTimestamp(input, String(options.mode || 'auto'))) }
    case 'curl-to-fetch-converter': {
      const parsed = curlToRequest(input)
      return {
        output: `fetch(${JSON.stringify(parsed.url)}, {
  method: ${JSON.stringify(parsed.method)},
  headers: ${JSON.stringify(parsed.headers, null, 2)},
  body: ${parsed.body ? JSON.stringify(parsed.body) : 'undefined'},
})`,
      }
    }
    case 'curl-to-axios-converter': {
      const parsed = curlToRequest(input)
      return {
        output: `axios({
  url: ${JSON.stringify(parsed.url)},
  method: ${JSON.stringify(parsed.method.toLowerCase())},
  headers: ${JSON.stringify(parsed.headers, null, 2)},
  data: ${parsed.body ? JSON.stringify(parsed.body) : 'undefined'},
})`,
      }
    }
    case 'sql-formatter':
      return { output: formatSql(input) }
    case 'sql-minifier':
      return { output: minifySql(input) }
    case 'sql-to-json':
      return { output: asPrettyText(sqlToJson(input)) }
    case 'json-to-sql':
      return { output: jsonToSql(input, String(options.tableName || 'my_table')) }

    case 'sql-pretty-print':
      return { output: formatSql(input) }
    case 'sql-schema-generator': {
      const tableName = String(options.tableName || 'my_table').trim() || 'my_table'
      const dialect = String(options.dialect || 'mysql')
      return { output: sqlSchemaFromJson(input, tableName, dialect) }
    }
    case 'mongo-query-formatter':
      return { output: mongoQueryFormat(input) }

    case 'word-counter':
      return { output: asPrettyText({ words: input.trim() ? input.trim().split(/\s+/).length : 0 }) }
    case 'character-counter':
      return { output: asPrettyText({ characters: input.length }) }
    case 'text-sorter':
      return { output: input.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n') }
    case 'text-deduplicator':
    case 'remove-duplicate-lines':
      return { output: [...new Set(input.split(/\r?\n/))].join('\n') }
    case 'text-diff-checker':
      return { output: asPrettyText(diffLines(input, secondaryInput)) }
    case 'case-converter':
      return { output: asPrettyText(convertCase(input, String(options.caseMode || 'all'))) }
    case 'remove-line-breaks':
      return { output: input.replace(/\r?\n/g, ' ') }
    case 'random-text-generator':
      return { output: randomText(Number(options.length || 16)) }
    case 'lorem-ipsum-generator':
      return { output: lorem(Number(options.paragraphs || 3)) }
    case 'random-name-generator': {
      const locale = (options.locale as string) || 'zh'
      const count = Math.min(Math.max(Number(options.count) || 10, 1), 100)
      const names = randomName(locale === 'en' ? 'en' : locale === 'mixed' ? 'mixed' : 'zh', count)
      return { output: names.join('\n') }
    }
    case 'random-json-generator': {
      const count = Math.min(Math.max(Number(options.count) || 5, 1), 100)
      const keysStr = String(options.keys || 'id,name:string,value:number,active:boolean').trim()
      const arr = randomJson(count, keysStr)
      return { output: asPrettyText(arr) }
    }

    case 'image-base64-converter':
    case 'image-to-base64':
    case 'base64-to-image': {
      const mode =
        tool.id === 'image-to-base64'
          ? 'image-to-base64'
          : tool.id === 'base64-to-image'
            ? 'base64-to-image'
            : String(options.mode || 'image-to-base64')
      if (mode === 'image-to-base64') {
        const file = ensureUploadedFile(options.file, '图片')
        const mimeType = file.type || 'image/png'
        const dataUrl = `data:${mimeType};base64,${file.contentBase64}`
        return {
          output: dataUrl,
          copyText: dataUrl,
          previewImage: dataUrl,
        }
      }
      const raw = input.trim()
      if (!raw) throw new Error('请输入图片 Base64 内容')
      const match = raw.match(/^data:([^;,]+)?;base64,([\s\S]+)$/i)
      const mimeType = match?.[1] || 'image/png'
      if (!mimeType.startsWith('image/')) {
        throw new Error('Base64 内容不是有效图片')
      }
      const contentBase64 = (match?.[2] || raw).replace(/\s+/g, '')
      const ext = extFromMimeType(mimeType) || '.png'
      const filename = String(options.filename || `converted_image${ext}`)
      const dataUrl = `data:${mimeType};base64,${contentBase64}`
      return {
        output: asPrettyText({ filename, mimeType, sizeBytes: Math.floor((contentBase64.length * 3) / 4) }),
        previewImage: dataUrl,
        downloadFile: { filename, mimeType, contentBase64 },
      }
    }
    case 'image-compressor': {
      const file = ensureUploadedFile(options.file)
      const quality = clampNumber(Number(options.quality || 0.8), 0, 1)
      const format = String(options.format || 'image/jpeg')
      const dataUrl = dataUrlFromFile(file)
      const image = await loadImageElement(dataUrl)
      const maxWidth = Number(options.maxWidth || image.width)
      const maxHeight = Number(options.maxHeight || image.height)
      const { width, height } = fitContainSize(image.width, image.height, maxWidth, maxHeight)
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('浏览器不支持 Canvas 2D')
      ctx.drawImage(image, 0, 0, width, height)
      const outputDataUrl = canvas.toDataURL(format, quality)
      const contentBase64 = outputDataUrl.split(',')[1] || ''
      const filename = `${baseName(file.name)}_compressed${extFromMimeType(format)}`
      return {
        output: asPrettyText({ filename, width, height, format, quality }),
        previewImage: outputDataUrl,
        downloadFile: { filename, mimeType: format, contentBase64 },
      }
    }
    case 'image-resizer': {
      const file = ensureUploadedFile(options.file)
      const width = Math.max(1, Number(options.width || 800))
      const height = Math.max(1, Number(options.height || 600))
      const fit = String(options.fit || 'contain') as 'contain' | 'cover' | 'fill'
      const format = String(options.format || 'image/png')
      const image = await loadImageElement(dataUrlFromFile(file))
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('浏览器不支持 Canvas 2D')
      drawWithFit(ctx, image, width, height, fit)
      const outputDataUrl = canvas.toDataURL(format, 0.92)
      const contentBase64 = outputDataUrl.split(',')[1] || ''
      const filename = `${baseName(file.name)}_${width}x${height}${extFromMimeType(format)}`
      return {
        output: asPrettyText({ filename, width, height, fit, format }),
        previewImage: outputDataUrl,
        downloadFile: { filename, mimeType: format, contentBase64 },
      }
    }
    case 'image-cropper': {
      const file = ensureUploadedFile(options.file)
      const x = Math.max(0, Number(options.x || 0))
      const y = Math.max(0, Number(options.y || 0))
      const width = Math.max(1, Number(options.width || 300))
      const height = Math.max(1, Number(options.height || 300))
      const format = String(options.format || 'image/png')
      const image = await loadImageElement(dataUrlFromFile(file))
      const cropW = Math.min(width, Math.max(1, image.width - x))
      const cropH = Math.min(height, Math.max(1, image.height - y))
      const canvas = createCanvas(cropW, cropH)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('浏览器不支持 Canvas 2D')
      ctx.drawImage(image, x, y, cropW, cropH, 0, 0, cropW, cropH)
      const outputDataUrl = canvas.toDataURL(format, 0.92)
      const contentBase64 = outputDataUrl.split(',')[1] || ''
      const filename = `${baseName(file.name)}_crop${extFromMimeType(format)}`
      return {
        output: asPrettyText({ filename, x, y, width: cropW, height: cropH, format }),
        previewImage: outputDataUrl,
        downloadFile: { filename, mimeType: format, contentBase64 },
      }
    }
    case 'image-format-converter': {
      const file = ensureUploadedFile(options.file)
      const targetFormat = String(options.targetFormat || 'image/png')
      const quality = clampNumber(Number(options.quality || 0.9), 0, 1)
      const image = await loadImageElement(dataUrlFromFile(file))
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('浏览器不支持 Canvas 2D')
      ctx.drawImage(image, 0, 0, image.width, image.height)
      const outputDataUrl = canvas.toDataURL(targetFormat, quality)
      const contentBase64 = outputDataUrl.split(',')[1] || ''
      const filename = `${baseName(file.name)}${extFromMimeType(targetFormat)}`
      return {
        output: asPrettyText({ filename, targetFormat, quality }),
        previewImage: outputDataUrl,
        downloadFile: { filename, mimeType: targetFormat, contentBase64 },
      }
    }
    case 'qr-code-generator': {
      const dataUrl = await QRCode.toDataURL(input || ' ')
      return {
        output: dataUrl,
        copyText: dataUrl,
        previewImage: dataUrl,
      }
    }
    case 'qr-code-decoder': {
      const text = input.trim()
      if (!text) {
        throw new Error('请输入要解析的二维码内容字符串')
      }

      if (/^WIFI:/i.test(text)) {
        const body = text.replace(/^WIFI:/i, '')
        const getField = (key: string) => {
          const match = body.match(new RegExp(`${key}:([^;]*)`))
          if (!match) return ''
          return match[1]?.replace(/\\([\\;,:"])/g, '$1') ?? ''
        }

        const ssid = getField('S')
        const encryption = getField('T') || 'nopass'
        const password = getField('P')
        const hiddenRaw = getField('H')
        const hidden = /^true$/i.test(hiddenRaw)

        return {
          output: asPrettyText({
            type: 'wifi',
            ssid,
            encryption,
            password,
            hidden,
            raw: text,
          }),
        }
      }

      return {
        output: asPrettyText({
          type: 'raw',
          value: text,
        }),
      }
    }
    case 'wifi-qr-generator': {
      const ssid = String(options.ssid || '').trim()
      const password = String(options.password || '')
      const encryption = String(options.encryption || 'WPA')
      const hidden = Boolean(options.hidden || false)

      if (!ssid) {
        throw new Error('请填写 WiFi 名称（SSID）')
      }

      const fields = [
        `S:${ssid.replace(/([\\;,:"])/g, '\\$1')};`,
        encryption === 'nopass' ? '' : `T:${encryption};`,
        encryption === 'nopass' || !password
          ? ''
          : `P:${password.replace(/([\\;,:"])/g, '\\$1')};`,
        hidden ? 'H:true;' : '',
      ].join('')

      const payload = `WIFI:${fields};`
      const dataUrl = await QRCode.toDataURL(payload)

      return {
        output: payload,
        copyText: payload,
        previewImage: dataUrl,
      }
    }
    case 'qr-code-scanner': {
      const file = ensureUploadedFile(options.file)
      const dataUrl = dataUrlFromFile(file)
      const image = await loadImageElement(dataUrl)
      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string; format?: string }>> } }).BarcodeDetector
      if (!BarcodeDetectorCtor) {
        throw new Error('当前浏览器不支持二维码识别，请使用 Chromium 内核浏览器')
      }
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })
      const results = await detector.detect(image)
      if (!results.length) {
        throw new Error('未识别到二维码，请尝试更清晰的图片')
      }
      return {
        output: asPrettyText({
          count: results.length,
          results: results.map((item) => ({ value: item.rawValue || '', format: item.format || 'qr_code' })),
        }),
      }
    }

    case 'file-size-converter':
      return {
        output: asPrettyText(convertFileSize(input, String(options.fromUnit || 'MB'))),
      }
    case 'file-base64-converter':
    case 'file-to-base64':
    case 'base64-to-file': {
      const mode =
        tool.id === 'file-to-base64'
          ? 'file-to-base64'
          : tool.id === 'base64-to-file'
            ? 'base64-to-file'
            : String(options.mode || 'file-to-base64')
      if (mode === 'file-to-base64') {
        const file = ensureUploadedFile(options.file)
        const mimeType = file.type || 'application/octet-stream'
        const dataUrl = `data:${mimeType};base64,${file.contentBase64}`
        return {
          output: dataUrl,
          copyText: dataUrl,
        }
      }
      const raw = input.trim()
      if (!raw) throw new Error('请输入 Base64 内容')
      const match = raw.match(/^data:([^;,]+)?;base64,([\s\S]+)$/i)
      const mimeType = String(options.mimeType || (match?.[1] || 'application/octet-stream'))
      const contentBase64 = (match?.[2] || raw).replace(/\s+/g, '')
      const filename = String(options.filename || 'converted_file')
      return {
        output: asPrettyText({ filename, mimeType, sizeBytes: Math.floor((contentBase64.length * 3) / 4) }),
        downloadFile: { filename, mimeType, contentBase64 },
      }
    }

    case 'timestamp-date-converter':
    case 'timestamp-to-date':
    case 'unix-time-converter':
      return {
        output: asPrettyText(
          convertTimestamp(
            input,
            tool.id === 'timestamp-date-converter'
              ? String(options.mode || 'timestamp-to-date')
              : 'timestamp-to-date',
          ),
        ),
      }
    case 'date-to-timestamp':
      return { output: asPrettyText(convertTimestamp(input, 'date-to-timestamp')) }
    case 'time-zone-converter': {
      const date = new Date(input)
      const fromTimeZone = String(options.fromTimeZone || 'UTC')
      const toTimeZone = String(options.toTimeZone || 'Asia/Shanghai')
      return {
        output: asPrettyText({
          source: new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'full',
            timeStyle: 'long',
            timeZone: fromTimeZone,
          }).format(date),
          target: new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'full',
            timeStyle: 'long',
            timeZone: toTimeZone,
          }).format(date),
        }),
      }
    }
    case 'age-calculator': {
      const birth = new Date(input)
      const now = new Date()
      let years = now.getFullYear() - birth.getFullYear()
      let months = now.getMonth() - birth.getMonth()
      let days = now.getDate() - birth.getDate()
      if (days < 0) {
        months -= 1
        days += 30
      }
      if (months < 0) {
        years -= 1
        months += 12
      }
      return { output: asPrettyText({ years, months, days }) }
    }
    case 'countdown-timer-generator': {
      const diff = new Date(input).getTime() - Date.now()
      return {
        output: asPrettyText({
          expired: diff <= 0,
          milliseconds: diff,
          seconds: Math.floor(diff / 1000),
          minutes: Math.floor(diff / 60000),
          hours: Math.floor(diff / 3600000),
          days: Math.floor(diff / 86400000),
        }),
      }
    }
    case 'working-days-calculator':
      return {
        output: asPrettyText({
          workingDays: countWorkingDays(String(options.startDate || ''), String(options.endDate || '')),
        }),
      }
    case 'random-date-generator':
      return {
        output: randomDate(String(options.startDate || ''), String(options.endDate || '')),
      }

    case 'http-status-checker': {
      return {
        output: asPrettyText(await checkHttpStatus(input)),
      }
    }
    case 'url-parser': {
      const url = new URL(input)
      return {
        output: asPrettyText({
          href: url.href,
          protocol: url.protocol,
          host: url.host,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          params: Object.fromEntries(url.searchParams.entries()),
        }),
      }
    }
    case 'url-shortener': {
      const original = input.trim()
      if (!original) {
        throw new Error('请输入要缩短的 URL')
      }
      const parsed = new URL(original)
      const baseUrl = String(options.baseUrl || 'https://short.local').trim().replace(/\/+$/, '')
      const customCode = String(options.customCode || '').trim()
      const length = Math.min(Math.max(Number(options.length || 7), 4), 24)
      const code = customCode || shortHash(`${original}|${Date.now()}`, length)
      return {
        output: asPrettyText({
          original: parsed.toString(),
          shortUrl: `${baseUrl}/${code}`,
          code,
          mode: customCode ? 'custom' : 'generated',
        }),
      }
    }
    case 'hex-to-rgb': {
      const { r, g, b } = parseHexColor(input)
      return {
        output: asPrettyText({
          r,
          g,
          b,
          css: `rgb(${r}, ${g}, ${b})`,
        }),
      }
    }
    case 'rgb-to-hex': {
      const { r, g, b } = parseRgb(input)
      return {
        output: asPrettyText({
          hex: rgbToHex(r, g, b),
          r,
          g,
          b,
        }),
      }
    }
    case 'hsl-converter': {
      if (/^hsl\(/i.test(input.trim())) {
        const normalized = input.replace(/\s+/g, '')
        const match = normalized.match(
          /^hsl\(([-\d.]+),([-\d.]+)%?,([-\d.]+)%?\)$/i,
        )
        if (!match) {
          throw new Error('请输入合法的 hsl() 颜色，例如 hsl(200,50%,50%)')
        }
        const [, hs, ss, ls] = match
        const h = Number(hs)
        const s = Number(ss)
        const l = Number(ls)
        const { r, g, b } = hslToRgb(h, s, l)
        return {
          output: asPrettyText({
            mode: 'HSL -> RGB/HEX',
            h,
            s,
            l,
            r,
            g,
            b,
            hex: rgbToHex(r, g, b),
          }),
        }
      }
      const { r, g, b } = parseRgb(input)
      const { h, s, l } = rgbToHsl(r, g, b)
      return {
        output: asPrettyText({
          mode: 'RGB -> HSL/HEX',
          r,
          g,
          b,
          h,
          s,
          l,
          hsl: `hsl(${h}, ${s}%, ${l}%)`,
          hex: rgbToHex(r, g, b),
        }),
      }
    }
    case 'random-color-generator': {
      const hex = randomColorHex()
      const { r, g, b } = parseHexColor(hex)
      const { h, s, l } = rgbToHsl(r, g, b)
      return {
        output: asPrettyText({
          hex,
          rgb: `rgb(${r}, ${g}, ${b})`,
          hsl: `hsl(${h}, ${s}%, ${l}%)`,
        }),
      }
    }
    case 'length-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'm')
      const toUnit = String(options.toUnit || 'cm')
      const result = convertLength(value, fromUnit, toUnit)
      return {
        output: asPrettyText({
          value,
          fromUnit,
          toUnit,
          result,
        }),
      }
    }
    case 'weight-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'kg')
      const toUnit = String(options.toUnit || 'g')
      const result = convertWeight(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'temperature-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'C')
      const toUnit = String(options.toUnit || 'F')
      const result = convertTemperature(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'speed-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'km/h')
      const toUnit = String(options.toUnit || 'm/s')
      const result = convertSpeed(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'data-size-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'MB')
      const toUnit = String(options.toUnit || 'GB')
      const result = convertDataSize(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'energy-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'kJ')
      const toUnit = String(options.toUnit || 'kcal')
      const result = convertEnergy(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'angle-converter': {
      const value = Number(input)
      const fromUnit = String(options.fromUnit || 'deg')
      const toUnit = String(options.toUnit || 'rad')
      const result = convertAngle(value, fromUnit, toUnit)
      return {
        output: asPrettyText({ value, fromUnit, toUnit, result }),
      }
    }
    case 'random-number-generator': {
      const min = Number(options.min ?? 0)
      const max = Number(options.max ?? 100)
      const integer = Boolean(options.integer ?? true)
      let value: number
      if (integer) {
        value = randomInt(min, max)
      } else {
        value = Math.random() * (max - min) + min
      }
      return {
        output: asPrettyText({ min, max, integer, value }),
      }
    }
    case 'random-string-generator': {
      const length = Number(options.length || 16)
      const charsetPreset = String(options.charset || 'alnum')
      const presets: Record<string, string> = {
        alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        numeric: '0123456789',
      }
      const customCharset = String(options.customCharset || '')
      const charset =
        (charsetPreset === 'custom' && customCharset) ||
        presets[charsetPreset] ||
        presets.alnum
      const value = randomStringByCharset(length, charset)
      return {
        output: value,
      }
    }
    case 'random-uuid-generator': {
      const count = clamp(Number(options.count || 10), 1, 100)
      const uuids = Array.from({ length: count }, () => crypto.randomUUID())
      return {
        output: uuids.join('\n'),
      }
    }
    case 'nanoid-generator': {
      const length = clamp(Number(options.length || 21), 4, 64)
      const count = clamp(Number(options.count || 10), 1, 100)
      const ids = Array.from({ length: count }, () => randomNanoId(length))
      return {
        output: ids.join('\n'),
      }
    }
    case 'jwt-decoder':
      return {
        output: asPrettyText(decodeJwt(input)),
      }
    case 'http-status-code-lookup': {
      const code = Number(input)
      return {
        output: asPrettyText(lookupHttpStatus(code)),
      }
    }
    case 'url-slug-generator':
      return {
        output: slugify(input),
      }
    case 'domain-extractor':
      return {
        output: asPrettyText(extractDomain(input)),
      }
    case 'html-formatter':
      return { output: formatHtml(input) }
    case 'html-minifier':
      return { output: minifyHtml(input) }
    case 'css-formatter':
      return { output: formatCss(input) }
    case 'css-minifier':
      return { output: minifyCss(input) }
    case 'js-formatter':
      return { output: formatJs(input) }
    case 'js-minifier':
      return { output: minifyJs(input) }
    case 'css-to-js-converter':
      return { output: asPrettyText(cssToJsObject(input)) }
    case 'markdown-html-converter':
    case 'markdown-to-html':
    case 'markdown-preview':
      return {
        output:
          tool.id === 'markdown-html-converter' && String(options.mode || 'markdown-to-html') === 'html-to-markdown'
            ? htmlToMarkdown(input)
            : markdownToHtml(input),
      }
    case 'html-to-markdown':
      return { output: htmlToMarkdown(input) }
    case 'markdown-table-generator':
      return {
        output: generateMarkdownTable(
          String(options.columns || '列1,列2'),
          Number(options.rows || 3),
        ),
      }
    case 'markdown-cheat-sheet':
      return { output: markdownCheatSheet() }
    case 'meta-tag-generator': {
      const title = String(options.title || input || '示例页面标题')
      const description = String(
        options.description || '这里是一段页面描述，用于 SEO 展示摘要。',
      )
      const keywords = String(options.keywords || '关键词1,关键词2')
      const html = [
        `<title>${title}</title>`,
        `<meta name="description" content="${description}">`,
        `<meta name="keywords" content="${keywords}">`,
      ].join('\n')
      return { output: html }
    }
    case 'robots-generator': {
      const allow = String(options.allow || '/')
      const disallow = String(options.disallow || '')
      const lines = ['User-agent: *']
      if (allow) lines.push(`Allow: ${allow}`)
      if (disallow) lines.push(`Disallow: ${disallow}`)
      return { output: lines.join('\n') }
    }
    case 'sitemap-generator': {
      const base = String(options.baseUrl || '').trim() || input.trim() || 'https://example.com'
      const extra = String(options.paths || '/about,/contact')
      const urls = [base, ...extra.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)]
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          (url) => `  <url>
    <loc>${url}</loc>
  </url>`,
        ),
        '</urlset>',
      ].join('\n')
      return { output: xml }
    }
    case 'open-graph-generator': {
      const title = String(options.title || input || '示例页面标题')
      const description = String(
        options.description || '这里是一段用于社交分享的描述。',
      )
      const url = String(options.url || 'https://example.com')
      const image = String(options.image || 'https://example.com/og-image.png')
      const tags = [
        `<meta property="og:title" content="${title}">`,
        `<meta property="og:description" content="${description}">`,
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:image" content="${image}">`,
      ].join('\n')
      return { output: tags }
    }
    case 'keyword-density-checker': {
      const text = input
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
      const total = words.length
      const counts = words.reduce<Record<string, number>>((accumulator, word) => {
        accumulator[word] = (accumulator[word] || 0) + 1
        return accumulator
      }, {})
      const entries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([word, count]) => ({
          word,
          count,
          density: total ? Number(((count / total) * 100).toFixed(2)) : 0,
        }))
      return {
        output: asPrettyText({ totalWords: total, topKeywords: entries }),
      }
    }
    case 'html-tag-analyzer': {
      const tags = Array.from(
        input.matchAll(/<\s*([a-zA-Z0-9:-]+)/g),
      ).map((match) => match[1].toLowerCase())
      const total = tags.length
      const counts = tags.reduce<Record<string, number>>((accumulator, tag) => {
        accumulator[tag] = (accumulator[tag] || 0) + 1
        return accumulator
      }, {})
      return {
        output: asPrettyText({ totalTags: total, tags: counts }),
      }
    }
    case 'log-formatter':
      return {
        output: formatLogs(input),
      }
    case 'log-analyzer':
      return {
        output: asPrettyText(analyzeLogs(input)),
      }
    case 'stack-trace-parser':
      return {
        output: asPrettyText(parseStackTrace(input)),
      }
    case 'git-ignore-generator':
      return {
        output: buildGitIgnore(String(options.targets || '')),
      }
    case 'git-commit-message-generator': {
      const type = String(options.type || 'feat')
      const scope = String(options.scope || '').trim()
      const subject = String(options.subject || '').trim()
      const body = String(options.body || '').trim()
      if (!subject) {
        throw new Error('请填写“简要说明”')
      }
      const header = scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`
      const full = body ? `${header}\n\n${body}` : header
      return { output: full }
    }
    case 'git-diff-viewer':
      return {
        output: asPrettyText({
          summary: analyzeGitDiff(input),
          raw: input,
        }),
      }
    case 'git-patch-viewer':
      return {
        output: asPrettyText({
          summary: analyzeGitDiff(input),
          raw: input,
        }),
      }
    default:
      return {
        output: `${tool.name} 的前端逻辑待补充，页面和路由已经生成。`,
      }
  }
}
