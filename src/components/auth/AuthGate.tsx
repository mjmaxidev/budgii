import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isApiEnabled } from '@/api/config'
import { bootstrapSession } from '@/api/bootstrap'
import { restoreAuthTokens } from '@/api/auth'
import { startSyncEngine, stopSyncEngine } from '@/api/syncEngine'
import { useAuthStore } from '@/store/authStore'

const PUBLIC_PATHS = new Set(['/login', '/onboarding', '/verification'])

export function AuthGate() {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const status = useAuthStore((s) => s.status)
  const [tokensRestored, setTokensRestored] = useState(!isApiEnabled())

  const apiOn = isApiEnabled()
  const isPublic = PUBLIC_PATHS.has(location.pathname)
  const isJoin = location.pathname === '/join-family'

  useEffect(() => {
    if (!apiOn) {
      setTokensRestored(true)
      return
    }

    let cancelled = false
    ;(async () => {
      await restoreAuthTokens()
      if (!cancelled) setTokensRestored(true)
    })()

    return () => {
      cancelled = true
    }
  }, [apiOn])

  useEffect(() => {
    if (!apiOn || !tokensRestored || !accessToken) {
      stopSyncEngine()
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        if (status !== 'authenticated') {
          await bootstrapSession()
        }
        if (!cancelled) startSyncEngine()
      } catch {
        // login screen surfaces errors
      }
    })()

    return () => {
      cancelled = true
      stopSyncEngine()
    }
  }, [apiOn, accessToken, status, tokensRestored])

  if (!apiOn) {
    return <Outlet />
  }

  if (!tokensRestored) {
    return null
  }

  if (!accessToken && !isPublic && !isJoin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!accessToken && isJoin) {
    return <Navigate to="/login" replace state={{ from: '/join-family', join: true }} />
  }

  return <Outlet />
}
