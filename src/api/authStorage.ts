import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

type StoredAuthTokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'budgii.accessToken'
const REFRESH_TOKEN_KEY = 'budgii.refreshToken'
const WEB_TOKEN_KEY = 'budgii-auth-tokens'

function isNativeSecureStorage(): boolean {
  return Capacitor.isNativePlatform()
}

function loadWebTokens(): StoredAuthTokens | null {
  const raw = localStorage.getItem(WEB_TOKEN_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthTokens>
    if (!parsed.accessToken || !parsed.refreshToken) return null
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
  } catch {
    localStorage.removeItem(WEB_TOKEN_KEY)
    return null
  }
}

export async function loadStoredAuthTokens(): Promise<StoredAuthTokens | null> {
  if (!isNativeSecureStorage()) {
    return loadWebTokens()
  }

  try {
    const accessToken = await SecureStoragePlugin.get({ key: ACCESS_TOKEN_KEY })
    const refreshToken = await SecureStoragePlugin.get({ key: REFRESH_TOKEN_KEY })
    return { accessToken: accessToken.value, refreshToken: refreshToken.value }
  } catch {
    return null
  }
}

export async function saveStoredAuthTokens(tokens: StoredAuthTokens): Promise<void> {
  if (!isNativeSecureStorage()) {
    localStorage.setItem(WEB_TOKEN_KEY, JSON.stringify(tokens))
    return
  }

  await SecureStoragePlugin.set({ key: ACCESS_TOKEN_KEY, value: tokens.accessToken })
  await SecureStoragePlugin.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken })
}

export async function clearStoredAuthTokens(): Promise<void> {
  if (!isNativeSecureStorage()) {
    localStorage.removeItem(WEB_TOKEN_KEY)
    return
  }

  try {
    await SecureStoragePlugin.remove({ key: ACCESS_TOKEN_KEY })
    await SecureStoragePlugin.remove({ key: REFRESH_TOKEN_KEY })
  } catch {
    // Missing secure-storage keys are already cleared for session purposes.
  }
}
