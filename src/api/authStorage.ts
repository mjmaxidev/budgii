import { Capacitor } from '@capacitor/core'

type StoredAuthTokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'budgii.accessToken'
const REFRESH_TOKEN_KEY = 'budgii.refreshToken'
const WEB_TOKEN_KEY = 'budgii-auth-tokens'

async function getSecureStorage() {
  const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin')
  return SecureStoragePlugin
}

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
    const secureStorage = await getSecureStorage()
    const [accessToken, refreshToken] = await Promise.all([
      secureStorage.get({ key: ACCESS_TOKEN_KEY }),
      secureStorage.get({ key: REFRESH_TOKEN_KEY }),
    ])
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

  const secureStorage = await getSecureStorage()
  await Promise.all([
    secureStorage.set({ key: ACCESS_TOKEN_KEY, value: tokens.accessToken }),
    secureStorage.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken }),
  ])
}

export async function clearStoredAuthTokens(): Promise<void> {
  if (!isNativeSecureStorage()) {
    localStorage.removeItem(WEB_TOKEN_KEY)
    return
  }

  try {
    const secureStorage = await getSecureStorage()
    await Promise.all([
      secureStorage.remove({ key: ACCESS_TOKEN_KEY }),
      secureStorage.remove({ key: REFRESH_TOKEN_KEY }),
    ])
  } catch {
    // Missing secure-storage keys are already cleared for session purposes.
  }
}
