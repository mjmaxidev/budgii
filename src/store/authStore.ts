import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '@/api/types'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
  householdId: string | null
  syncRevision: number | null
  lastSyncedAt: string | null
  status: AuthStatus
  error: string | null

  setTokens: (accessToken: string, refreshToken: string) => void
  hydrateTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: UserResponse | null) => void
  setHouseholdId: (householdId: string | null) => void
  setSyncMeta: (revision: number, serverTime: string) => void
  setStatus: (status: AuthStatus, error?: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      householdId: null,
      syncRevision: null,
      lastSyncedAt: null,
      status: 'idle',
      error: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, status: 'authenticated', error: null }),

      hydrateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      setHouseholdId: (householdId) => set({ householdId }),

      setSyncMeta: (revision, serverTime) => set({ syncRevision: revision, lastSyncedAt: serverTime }),

      setStatus: (status, error = null) => set({ status, error }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          householdId: null,
          syncRevision: null,
          lastSyncedAt: null,
          status: 'idle',
          error: null,
        }),
    }),
    {
      name: 'budgii-auth',
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<AuthState>) }
        return { ...state, accessToken: null, refreshToken: null }
      },
      partialize: (state) => ({
        user: state.user,
        householdId: state.householdId,
        syncRevision: state.syncRevision,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
)

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken
}
