import { apiRequest } from '@/api/client'
import type { TokenResponse, UserResponse } from '@/api/types'
import { useAuthStore } from '@/store/authStore'

export async function register(email: string, password: string, name: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/auth/register', {
    method: 'POST',
    body: { email, password, name },
    auth: false,
  })
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens
}

export async function loginEmail(email: string, password: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/auth/email', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
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
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens
}

export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>('/users/me')
}

export function logout(): void {
  useAuthStore.getState().clearAuth()
}
