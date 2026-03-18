import type { ToolHandler } from '../../shared/types.js'

function toDate(input: string | number): string {
  const timestamp = Number(input)
  const value = String(input).length === 10 ? timestamp * 1000 : timestamp
  return new Date(value).toISOString()
}

function timeZoneConvert(
  input: string,
  options: Record<string, unknown> = {},
): Record<string, string> {
  const date = new Date(input)
  const fromTimeZone = (options.fromTimeZone as string) || 'UTC'
  const toTimeZone = (options.toTimeZone as string) || 'Asia/Shanghai'

  return {
    source: new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: fromTimeZone,
    }).format(date),
    target: new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: toTimeZone,
    }).format(date),
  }
}

function calculateAge(
  input: string,
  options: Record<string, unknown> = {},
): { years: number; months: number; days: number } {
  const birth = new Date(input)
  const now = new Date((options.now as number) || Date.now())
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

  return { years, months, days }
}

function countdown(
  input: string,
  options: Record<string, unknown> = {},
): Record<string, number | boolean> {
  const target = new Date(input)
  const now = new Date((options.now as number) || Date.now())
  const diff = target.getTime() - now.getTime()

  return {
    expired: diff <= 0,
    milliseconds: diff,
    seconds: Math.floor(diff / 1000),
    minutes: Math.floor(diff / 60000),
    hours: Math.floor(diff / 3600000),
    days: Math.floor(diff / 86400000),
  }
}

function workingDays(
  input: Record<string, unknown> | string,
  options: Record<string, unknown> = {},
): { workingDays: number } {
  const startVal = String((typeof input === 'object' && input !== null && (input as Record<string, unknown>).startDate) || (options.startDate as string) || '')
  const endVal = String((typeof input === 'object' && input !== null && (input as Record<string, unknown>).endDate) || (options.endDate as string) || '')
  const start = new Date(startVal)
  const end = new Date(endVal)
  let total = 0

  for (
    let current = new Date(start);
    current <= end;
    current.setDate(current.getDate() + 1)
  ) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) total += 1
  }

  return { workingDays: total }
}

function randomDate(
  input: Record<string, unknown> = {},
  options: Record<string, unknown> = {},
): string {
  const start = new Date(
    (input.startDate as string) || (options.startDate as string) || '2000-01-01',
  )
  const end = new Date(
    (input.endDate as string) || (options.endDate as string) || '2030-12-31',
  )
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
  return date.toISOString()
}

export const dateToolHandlers: Record<string, ToolHandler> = {
  'timestamp-to-date': (input) => ({ output: toDate(input as string) }),
  'date-to-timestamp': (input) => ({
    output: {
      milliseconds: new Date(input as string).getTime(),
      seconds: Math.floor(new Date(input as string).getTime() / 1000),
    },
  }),
  'time-zone-converter': (input, options) => ({ output: timeZoneConvert(input as string, options) }),
  'unix-time-converter': (input) => ({ output: { iso: toDate(input as string) } }),
  'age-calculator': (input, options) => ({ output: calculateAge(input as string, options) }),
  'countdown-timer-generator': (input, options) => ({ output: countdown(input as string, options) }),
  'working-days-calculator': (input, options) => ({ output: workingDays(input as unknown as Record<string, unknown> | string, options) }),
  'random-date-generator': (input, options) => ({ output: randomDate(input as unknown as Record<string, unknown>, options) }),
}
