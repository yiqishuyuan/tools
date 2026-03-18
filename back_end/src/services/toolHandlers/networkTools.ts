import dns from 'dns/promises'
import net from 'net'
import type { ToolHandler } from '../../shared/types.js'

function parseUrl(input: string): Record<string, unknown> {
  const url = new URL(input)
  return {
    href: url.href,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    params: Object.fromEntries(url.searchParams.entries()),
  }
}

async function httpStatusChecker(input: string): Promise<Record<string, unknown>> {
  const response = await fetch(input, { method: 'HEAD' }).catch(async () =>
    fetch(input),
  )
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    finalUrl: response.url,
  }
}

async function whoisLookup(input: string): Promise<unknown> {
  const query = String(input).trim()
  const target = /^[\d.:]+$/.test(query) ? `ip/${query}` : `domain/${query}`
  const response = await fetch(`https://rdap.org/${target}`)

  if (!response.ok) {
    throw new Error(`Whois lookup failed with status ${response.status}`)
  }

  return response.json()
}

async function dnsLookup(input: string): Promise<Record<string, unknown[]>> {
  const [aRecords, aaaaRecords, mxRecords] = await Promise.allSettled([
    dns.resolve4(input),
    dns.resolve6(input),
    dns.resolveMx(input),
  ])

  return {
    A: aRecords.status === 'fulfilled' ? aRecords.value : [],
    AAAA: aaaaRecords.status === 'fulfilled' ? aaaaRecords.value : [],
    MX: mxRecords.status === 'fulfilled' ? mxRecords.value : [],
  }
}

async function portChecker(
  input: string,
  options: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const host = (options.host as string) || input
  const port = Number(options.port || 80)

  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (result: Record<string, unknown>) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(3000)
    socket.once('connect', () => finish({ host, port, open: true }))
    socket.once('timeout', () =>
      finish({ host, port, open: false, reason: 'timeout' }),
    )
    socket.once('error', (error: Error) =>
      finish({ host, port, open: false, reason: error.message }),
    )
    socket.connect(port, host)
  })
}

async function ipLookup(input: string): Promise<unknown> {
  const target = String(input).trim()
  if (!target) {
    throw new Error('IP address is required.')
  }

  const response = await fetch(
    `https://ipapi.co/${encodeURIComponent(target)}/json/`,
  )
  return response.json()
}

export const networkToolHandlers: Record<string, ToolHandler> = {
  'whois-lookup': async (input) => ({ output: await whoisLookup(input as string) }),
  'ip-lookup': async (input) => ({ output: await ipLookup(input as string) }),
  'dns-lookup': async (input) => ({ output: await dnsLookup(input as string) }),
  'port-checker': async (input, options) => ({
    output: await portChecker(input as string, options),
  }),
  'http-status-checker': async (input) => ({
    output: await httpStatusChecker(input as string),
  }),
  'url-parser': (input) => ({ output: parseUrl(input as string) }),
}
