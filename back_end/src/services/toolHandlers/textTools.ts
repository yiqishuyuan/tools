import crypto from 'crypto'
import type { ToolHandler } from '../../shared/types.js'

function diffText(left: string, right: string) {
  const leftLines = left.split(/\r?\n/)
  const rightLines = right.split(/\r?\n/)
  return {
    added: rightLines.filter((line) => !leftLines.includes(line)),
    removed: leftLines.filter((line) => !rightLines.includes(line)),
    common: leftLines.filter((line) => rightLines.includes(line)),
  }
}

function convertCase(input: string) {
  const words = input.trim().split(/[\s_-]+/).filter(Boolean)
  return {
    lowerCase: input.toLowerCase(),
    upperCase: input.toUpperCase(),
    titleCase: input.replace(/\w\S*/g, (word) =>
      word[0].toUpperCase() + word.slice(1).toLowerCase(),
    ),
    camelCase:
      words[0]?.toLowerCase() +
        words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('') || '',
    snakeCase: words.map((w) => w.toLowerCase()).join('_'),
    kebabCase: words.map((w) => w.toLowerCase()).join('-'),
  }
}

function randomText(options: Record<string, unknown> = {}): string {
  const length = Number(options.length ?? 16)
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

function loremIpsum(options: Record<string, unknown> = {}): string {
  const paragraphs = Number(options.paragraphs ?? 2)
  const base =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  return Array.from({ length: paragraphs }, () => base).join('\n\n')
}

function convertFileSize(
  input: string | Record<string, unknown>,
  options: Record<string, unknown> = {},
): Record<string, number> {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const value = Number(
    typeof input === 'string'
      ? input.replace(/[^\d.]/g, '')
      : (input as Record<string, unknown>)?.value ?? 0,
  )
  const fromUnit =
    (typeof input === 'object' && input !== null && (input as Record<string, unknown>)?.unit) ||
    options.fromUnit ||
    (typeof input === 'string' ? input.replace(/[\d.\s]/g, '').toUpperCase() : 'B') ||
    'B'
  const bytes = value * Math.pow(1024, Math.max(units.indexOf(String(fromUnit)), 0))
  return units.reduce<Record<string, number>>((record, unit, index) => {
    record[unit] = Number((bytes / Math.pow(1024, index)).toFixed(4))
    return record
  }, {})
}

export const textToolHandlers: Record<string, ToolHandler> = {
  'word-counter': (input) => ({
    output: {
      words: (input as string).trim() ? (input as string).trim().split(/\s+/).length : 0,
    },
  }),
  'character-counter': (input) => ({ output: { characters: (input as string).length } }),
  'text-sorter': (input) => ({
    output: (input as string).split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n'),
  }),
  'text-deduplicator': (input) => ({
    output: [...new Set((input as string).split(/\r?\n/))].join('\n'),
  }),
  'text-diff-checker': (input) => {
    const obj = input as { left?: string; right?: string }
    return { output: diffText(obj?.left || '', obj?.right || '') }
  },
  'case-converter': (input) => ({ output: convertCase(input as string) }),
  'remove-line-breaks': (input) => ({ output: (input as string).replace(/\r?\n/g, ' ') }),
  'remove-duplicate-lines': (input) => ({
    output: [...new Set((input as string).split(/\r?\n/))].join('\n'),
  }),
  'random-text-generator': (_input, options) => ({ output: randomText(options) }),
  'lorem-ipsum-generator': (_input, options) => ({ output: loremIpsum(options) }),
  'file-size-converter': (input, options) => ({
    output: convertFileSize(input as string | Record<string, unknown>, options),
  }),
}
