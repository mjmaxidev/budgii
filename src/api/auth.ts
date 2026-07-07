import { apiRequest, apiUpload } from '@/api/client'
import { clearStoredAuthTokens, loadStoredAuthTokens, saveStoredAuthTokens } from '@/api/authStorage'
import type { TokenResponse, UpdateUserInput, UserResponse } from '@/api/types'
import { useAuthStore } from '@/store/authStore'

export async function register(email: string, password: string, name: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, name },
    auth: false,
  })
  await saveStoredAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens
}

export async function loginEmail(email: string, password: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/auth/email', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
  await saveStoredAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens
}

export async function refreshTokens(): Promise<TokenResponse> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  const tokens = await apiRequest<TokenResponse>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
    auth: false,
    retry: false,
  })
  await saveStoredAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens
}

export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>('/users/me')
}

export async function updateMe(input: UpdateUserInput): Promise<UserResponse> {
  const user = await apiRequest<UserResponse>('/users/me', {
    method: 'PATCH',
    body: input,
  })
  useAuthStore.getState().setUser(user)
  return user
}

export async function uploadAvatar(file: File): Promise<UserResponse> {
  const form = new FormData()
  form.append('file', file)
  const user = await apiUpload<UserResponse>('/users/me/avatar', form)
  useAuthStore.getState().setUser(user)
  return user
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<void>('/users/me/password', {
    method: 'POST',
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  })
}

export async function restoreAuthTokens(): Promise<boolean> {
  const current = useAuthStore.getState()
  if (current.accessToken && current.refreshToken) return true

  const tokens = await loadStoredAuthTokens()
  if (!tokens) return false

  useAuthStore.getState().hydrateTokens(tokens.accessToken, tokens.refreshToken)
  return true
}

export function logout(): void {
  void clearStoredAuthTokens()
  useAuthStore.getState().clearAuth()
}
