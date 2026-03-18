import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import YAML from 'yaml'
import type { ToolHandler } from '../../shared/types.js'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
})

function assertTextInput(
  input: unknown,
  message = 'This tool requires text input.',
): asserts input is string {
  if (typeof input !== 'string') {
    const error = new Error(message)
    ;(error as Error & { statusCode?: number }).statusCode = 400
    throw error
  }
}

function parseJson(input: unknown): unknown {
  assertTextInput(input, 'JSON input must be a string.')
  return JSON.parse(input)
}

function jsonToCsv(value: unknown): string {
  const rows = Array.isArray(value) ? value : [value]
  if (rows.length === 0) return ''

  const headers = [...new Set(rows.flatMap((row) => Object.keys((row as object) ?? {})))]
  const lines = [headers.join(',')]

  for (const row of rows) {
    const line = headers.map((header) => {
      const raw = (row as Record<string, unknown>)?.[header]
      if (raw === null || raw === undefined) return ''

      const cell = typeof raw === 'object' ? JSON.stringify(raw) : String(raw)
      return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
    })

    lines.push(line.join(','))
  }

  return lines.join('\n')
}

function csvToJson(input: unknown): Record<string, string>[] {
  assertTextInput(input)
  const lines = (input as string)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const parseLine = (line: string): string[] => {
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

  const headers = parseLine(lines[0]).map((item) => item.trim())
  return lines.slice(1).map((line) => {
    const values = parseLine(line)
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? ''
      return record
    }, {})
  })
}

function resolveJsonPath(data: unknown, pathStr: string): unknown {
  if (!pathStr || pathStr === '$') return data

  const normalized = pathStr
    .replace(/^\$\./, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let current: unknown = data
  for (const token of normalized) {
    current = (current as Record<string, unknown>)?.[Number.isNaN(Number(token)) ? token : Number(token)]
  }

  return current
}

function diffText(left: string, right: string) {
  const leftLines = left.split(/\r?\n/)
  const rightLines = right.split(/\r?\n/)

  return {
    added: rightLines.filter((line) => !leftLines.includes(line)),
    removed: leftLines.filter((line) => !rightLines.includes(line)),
    common: leftLines.filter((line) => rightLines.includes(line)),
  }
}

export const formatToolHandlers: Record<string, ToolHandler> = {
  'json-formatter': (input) => ({ output: JSON.stringify(parseJson(input), null, 2) }),
  'json-validator': (input) => ({ output: { valid: true, parsed: parseJson(input) } }),
  'json-minify': (input) => ({ output: JSON.stringify(parseJson(input)) }),
  'json-pretty-print': (input) => ({ output: JSON.stringify(parseJson(input), null, 2) }),
  'json-viewer': (input) => ({ output: JSON.stringify(parseJson(input), null, 2) }),
  'json-to-xml': (input) => ({ output: xmlBuilder.build(parseJson(input) as object) }),
  'xml-to-json': (input) => ({ output: xmlParser.parse(input as string) }),
  'json-to-csv': (input) => ({ output: jsonToCsv(parseJson(input)) }),
  'csv-to-json': (input) => ({ output: csvToJson(input) }),
  'json-to-yaml': (input) => ({ output: YAML.stringify(parseJson(input)) }),
  'yaml-to-json': (input) => ({ output: YAML.parse(input as string) }),
  'json-compare': (input) => {
    const obj = typeof input === 'object' && input !== null ? (input as { left?: unknown; right?: unknown }) : null
    const left = obj?.left ?? null
    const right = obj?.right ?? null
    return { output: { equal: JSON.stringify(left) === JSON.stringify(right), left, right } }
  },
  'json-diff-tool': (input) => {
    const obj = typeof input === 'object' && input !== null ? (input as { left?: unknown; right?: unknown }) : null
    const left = obj?.left ?? null
    const right = obj?.right ?? null
    return { output: diffText(JSON.stringify(left, null, 2), JSON.stringify(right, null, 2)) }
  },
  'json-path-tester': (input, options) => ({
    output: resolveJsonPath(parseJson(input), (options?.path as string) || '$'),
  }),
  'json-escape-unescape': (input, options) => ({
    output:
      options?.mode === 'unescape'
        ? JSON.parse(`"${(input as string).replace(/"/g, '\\"')}"`)
        : JSON.stringify(input).slice(1, -1),
  }),
}
