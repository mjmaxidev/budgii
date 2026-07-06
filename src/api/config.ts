const DEFAULT_BASE_URL = 'http://localhost:8001/v1'

export function isApiEnabled(): boolean {
  return import.meta.env.VITE_API_ENABLED === 'true'
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim()
  return (base || DEFAULT_BASE_URL).replace(/\/$/, '')
}
