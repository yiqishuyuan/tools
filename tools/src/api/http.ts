import request from '../utils/request/request'

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

export function parseHeaderText(value: string): Record<string, string> {
  const result: Record<string, string> = {}
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separator = line.indexOf(':')
      if (separator <= 0) {
        return
      }
      const key = line.slice(0, separator).trim()
      const headerValue = line.slice(separator + 1).trim()
      if (key) {
        result[key] = headerValue
      }
    })
  return result
}

function parseResponseBody(responseText: string): unknown {
  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

function normalizeHeaders(
  headers: unknown,
) {
  if (!headers) {
    return {}
  }
  if (
    typeof headers === 'object' &&
    'toJSON' in headers &&
    typeof (headers as { toJSON?: unknown }).toJSON === 'function'
  ) {
    return (headers as { toJSON: () => unknown }).toJSON()
  }
  return headers as Record<string, unknown>
}

export async function sendHttpRequest(params: {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  body?: string
}) {
  const start = performance.now()
  const response = await request.request<string>({
    url: params.url,
    method: params.method,
    headers: params.headers,
    data: !['GET', 'HEAD'].includes(params.method) && params.body ? params.body : undefined,
    responseType: 'text',
    validateStatus: () => true,
  })
  const elapsed = Math.round(performance.now() - start)
  const responseText = String(response.data ?? '')

  return {
    status: response.status,
    statusText: response.statusText,
    elapsed,
    headers: normalizeHeaders(response.headers),
    body: parseResponseBody(responseText),
  }
}

export async function inspectHttpHeaders(url: string) {
  let response
  try {
    response = await request.request({
      url,
      method: 'HEAD',
      validateStatus: () => true,
    })
  } catch {
    response = await request.request({
      url,
      method: 'GET',
      validateStatus: () => true,
    })
  }
  return {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeHeaders(response.headers),
  }
}

export async function checkHttpStatus(url: string) {
  let response
  try {
    response = await request.request({
      url,
      method: 'HEAD',
      validateStatus: () => true,
    })
  } catch {
    response = await request.request({
      url,
      method: 'GET',
      validateStatus: () => true,
    })
  }
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.status >= 200 && response.status < 300,
    finalUrl: response.request?.responseURL || url,
  }
}
