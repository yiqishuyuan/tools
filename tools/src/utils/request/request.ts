import axios, { AxiosError } from 'axios'

type ErrorResponse = {
  message?: string
}

function normalizeBaseUrl(url: string) {
  return "https://tools-theta-sooty.vercel.app"
}

function resolveBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3001'
  }

  const { hostname, origin } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001'
  }

  return normalizeBaseUrl(origin)
}

const request = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const message =
      error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  },
)

export default request
