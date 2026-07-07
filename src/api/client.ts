import { getApiBaseUrl } from '@/api/config'
import { refreshTokens } from '@/api/auth'
import { clearStoredAuthTokens } from '@/api/authStorage'
import { getAccessToken, getRefreshToken, useAuthStore } from '@/store/authStore'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  headers?: Record<string, string>
  retry?: boolean
}

async function parseError(res: Response): Promise<ApiError> {
  let detail: unknown
  let message = res.statusText || 'Request failed'
  try {
    const data = (await res.json()) as { detail?: unknown }
    detail = data.detail
    if (typeof data.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      message = String(data.detail[0].msg)
    }
  } catch {
    // ignore parse errors
  }
  return new ApiError(res.status, message, detail)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {}, retry = true } = options
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const reqHeaders: Record<string, string> = { ...headers }
  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getAccessToken()
    if (token) reqHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && retry && getRefreshToken()) {
    try {
      await refreshTokens()
      return apiRequest<T>(path, { ...options, retry: false })
    } catch {
      void clearStoredAuthTokens()
      useAuthStore.getState().clearAuth()
      throw await parseError(res)
    }
  }

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as T
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { method: 'POST', headers, body: formData })
  if (!res.ok) {
    throw await parseError(res)
  }
  return (await res.json()) as T
}

export async function apiBlob(path: string, options: Pick<RequestOptions, 'auth' | 'retry'> = {}): Promise<Blob> {
  const { auth = true, retry = true } = options
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers: Record<string, string> = {}
  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })

  if (res.status === 401 && auth && retry && getRefreshToken()) {
    try {
      await refreshTokens()
      return apiBlob(path, { ...options, retry: false })
    } catch {
      void clearStoredAuthTokens()
      useAuthStore.getState().clearAuth()
      throw await parseError(res)
    }
  }

  if (!res.ok) {
    throw await parseError(res)
  }

  return res.blob()
}
