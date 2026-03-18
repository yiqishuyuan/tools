import crypto from 'crypto'
import UAParser from 'ua-parser-js'
import type { ToolHandler } from '../../shared/types.js'

function runRegex(input: string, options: Record<string, unknown> = {}): unknown[] {
  const pattern = String(options.pattern ?? '')
  const flags = String(options.flags ?? 'g')
  const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
  const matches: { value: string; index: number; groups: string[] }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    matches.push({ value: match[0], index: match.index, groups: match.slice(1) })
  }
  return matches
}

function parseCurl(command: string): { url: string; method: string; headers: string[]; body: string } {
  const url = command.match(/https?:\/\/[^\s'"]+/)?.[0] ?? ''
  const method = command.match(/-X\s+([A-Z]+)/i)?.[1]?.toUpperCase() ?? 'GET'
  const headers = [...command.matchAll(/-H\s+["']([^"']+)["']/g)].map((m) => m[1])
  const body = command.match(/(?:--data|-d)\s+["']([\s\S]*?)["']/)?.[1] ?? ''
  return { url, method, headers, body }
}

function formatSql(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(
      /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|INNER JOIN|LEFT JOIN|RIGHT JOIN|LIMIT)\b/gi,
      '\n$1',
    )
    .trim()
}

function minifySql(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

function jsonToSql(input: string | unknown, options: Record<string, unknown> = {}): string {
  const data = typeof input === 'string' ? JSON.parse(input) : input
  const rows = Array.isArray(data) ? data : [data]
  const table = (options.tableName as string) || 'my_table'
  if (rows.length === 0) return ''
  const columns = Object.keys(rows[0] as object)
  const values = (rows as Record<string, unknown>[])
    .map((row) => {
      const line = columns.map((col) => {
        const value = row[col]
        if (value === null || value === undefined) return 'NULL'
        if (typeof value === 'number' || typeof value === 'boolean') return String(value)
        return "'" + String(value).replace(/'/g, "''") + "'"
      })
      return '(' + line.join(', ') + ')'
    })
    .join(',\n')
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values};`
}

function sqlToJson(input: string): Record<string, unknown>[] {
  const normalized = minifySql(input)
  const match = normalized.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*(.+);?$/i)
  if (!match) throw new Error('Only simple INSERT INTO ... VALUES SQL is supported.')
  const columns = match[1].split(',').map((c) => c.trim())
  const rawRows = [...match[2].matchAll(/\(([^)]+)\)/g)].map((item) => item[1])
  return rawRows.map((row) => {
    const values = row.split(',').map((v) => v.trim().replace(/^'|'$/g, ''))
    return columns.reduce<Record<string, unknown>>((record, col, i) => {
      record[col] = values[i] ?? null
      return record
    }, {})
  })
}

function parseHeaders(headersInput: string): Record<string, string> {
  return String(headersInput)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((headers, line) => {
      const i = line.indexOf(':')
      if (i === -1) return headers
      const key = line.slice(0, i).trim()
      const value = line.slice(i + 1).trim()
      if (key) headers[key] = value
      return headers
    }, {})
}

async function runHttpRequest(
  input: string,
  options: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const url = String(input || '').trim()
  if (!url) throw new Error('Request URL is required.')
  const method = String(options.method || 'GET').toUpperCase()
  const requestHeaders = parseHeaders((options.headers as string) || '')
  const requestInit: RequestInit = { method, headers: requestHeaders }
  if (!['GET', 'HEAD'].includes(method) && options.body) {
    requestInit.body = String(options.body)
  }
  const response = await fetch(url, requestInit)
  const contentType = response.headers.get('content-type') || ''
  const responseText = await response.text()
  let responseBody: unknown = responseText
  if (contentType.includes('application/json')) {
    try {
      responseBody = JSON.parse(responseText)
    } catch {
      responseBody = responseText
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    finalUrl: response.url,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
  }
}

function buildCronExpression(options: Record<string, unknown> = {}): string {
  const minute = String(options.minute ?? '*').trim() || '*'
  const hour = String(options.hour ?? '*').trim() || '*'
  const dayOfMonth = String(options.dayOfMonth ?? '*').trim() || '*'
  const month = String(options.month ?? '*').trim() || '*'
  const dayOfWeek = String(options.dayOfWeek ?? '*').trim() || '*'
  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
}

async function inspectHttpHeaders(input: string): Promise<Record<string, unknown>> {
  const url = String(input || '').trim()
  if (!url) throw new Error('Target URL is required.')
  const response = await fetch(url, { method: 'HEAD' }).catch(() => fetch(url))
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    finalUrl: response.url,
    headers: Object.fromEntries(response.headers.entries()),
  }
}

export const devToolHandlers: Record<string, ToolHandler> = {
  'regex-tester': (input, options) => ({ output: runRegex(input as string, options) }),
  'http-request-tester': async (input, options) => ({
    output: await runHttpRequest(input as string, options),
  }),
  'api-tester': async (input, options) => ({
    output: await runHttpRequest(input as string, options),
  }),
  'http-header-checker': async (input) => ({
    output: await inspectHttpHeaders(input as string),
  }),
  'user-agent-parser': (input) => ({ output: new UAParser(input as string).getResult() }),
  'uuid-generator': () => ({ output: crypto.randomUUID() }),
  'timestamp-converter': (input) => ({
    output: {
      iso: new Date(
        String(input).length === 10 ? Number(input) * 1000 : Number(input),
      ).toISOString(),
      milliseconds:
        Number(String(input).length === 10 ? Number(input) * 1000 : Number(input)),
    },
  }),
  'curl-to-fetch-converter': (input) => {
    const parsed = parseCurl(input as string)
    return {
      output: `fetch(${JSON.stringify(parsed.url)}, {\n  method: ${JSON.stringify(parsed.method)},\n  headers: ${JSON.stringify(parsed.headers, null, 2)},\n  body: ${parsed.body ? JSON.stringify(parsed.body) : 'undefined'},\n})`,
    }
  },
  'curl-to-axios-converter': (input) => {
    const parsed = parseCurl(input as string)
    return {
      output: `axios({\n  url: ${JSON.stringify(parsed.url)},\n  method: ${JSON.stringify(parsed.method.toLowerCase())},\n  headers: ${JSON.stringify(parsed.headers, null, 2)},\n  data: ${parsed.body ? JSON.stringify(parsed.body) : 'undefined'},\n})`,
    }
  },
  'cron-expression-generator': (_input, options) => ({
    output: { expression: buildCronExpression(options), description: '分 时 日 月 周（0-6 或 SUN-SAT）' },
  }),
  'sql-formatter': (input) => ({ output: formatSql(input as string) }),
  'sql-minifier': (input) => ({ output: minifySql(input as string) }),
  'sql-to-json': (input) => ({ output: sqlToJson(input as string) }),
  'json-to-sql': (input, options) => ({ output: jsonToSql(input, options) }),
}
