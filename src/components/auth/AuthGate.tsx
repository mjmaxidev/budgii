import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isApiEnabled } from '@/api/config'
import { bootstrapSession } from '@/api/bootstrap'
import { startSyncEngine, stopSyncEngine } from '@/api/syncEngine'
import { PageTransition } from '@/components/motion/PageTransition'
import { useAuthStore } from '@/store/authStore'

const PUBLIC_PATHS = new Set(['/login', '/onboarding', '/verification'])

export function AuthGate() {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const status = useAuthStore((s) => s.status)

  const apiOn = isApiEnabled()
  const isPublic = PUBLIC_PATHS.has(location.pathname)
  const isJoin = location.pathname === '/join-family'

  useEffect(() => {
    if (!apiOn || !accessToken) {
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
  }, [apiOn, accessToken, status])

  if (!apiOn) {
    return (
      <PageTransition>
        <Outlet />
      </PageTransition>
    )
  }

  if (!accessToken && !isPublic && !isJoin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!accessToken && isJoin) {
    return <Navigate to="/login" replace state={{ from: '/join-family', join: true }} />
  }

  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  )
}
