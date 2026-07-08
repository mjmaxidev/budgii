import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { PinLockOverlay } from '@/components/security/PinLockOverlay'
import { PinSetupPromptModal } from '@/components/security/PinSetupPromptModal'
import { PinSetupModal } from '@/components/security/PinSetupModal'
import { isProtectedPath } from '@/components/security/appLockRoutes'
import { useStore } from '@/store/appStore'

type Props = { children: ReactNode }

export function AppLockProvider({ children }: Props) {
  const location = useLocation()
  const pinHash = useStore((s) => s.appLock?.pinHash)
  const pendingSetupPrompt = useStore((s) => s.appLock?.pendingSetupPrompt ?? false)
  const dismissPinSetupPrompt = useStore((s) => s.dismissPinSetupPrompt)

  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated())
  const sessionUnlocked = useRef(false)
  const protectedRoute = isProtectedPath(location.pathname)
  const pinEnabled = !!pinHash

  const [locked, setLocked] = useState(false)
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  // Require PIN on protected routes until this session is unlocked.
  useEffect(() => {
    if (!hydrated) return
    if (!pinEnabled || !protectedRoute) {
      setLocked(false)
      return
    }
    setLocked(!sessionUnlocked.current)
  }, [hydrated, pinEnabled, protectedRoute, location.pathname])

  // Lock when the app goes to the background.
  useEffect(() => {
    function onVisibilityChange() {
      if (!hydrated) return
      if (document.visibilityState !== 'hidden') return
      if (!pinEnabled || !protectedRoute) return
      sessionUnlocked.current = false
      setLocked(true)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [hydrated, pinEnabled, protectedRoute])

  // One-time PIN setup suggestion after onboarding.
  useEffect(() => {
    if (pendingSetupPrompt && !pinEnabled && protectedRoute) {
      setShowSetupPrompt(true)
    }
  }, [pendingSetupPrompt, pinEnabled, protectedRoute])

  function unlockSession() {
    sessionUnlocked.current = true
    setLocked(false)
  }

  function handlePinSetupSuccess() {
    sessionUnlocked.current = true
    setLocked(false)
    setShowSetupPrompt(false)
  }

  return (
    <>
      {children}
      {locked && pinEnabled && protectedRoute && <PinLockOverlay onUnlock={unlockSession} />}
      <PinSetupPromptModal
        open={showSetupPrompt}
        onSetUp={() => {
          setShowSetupPrompt(false)
          setShowPinSetup(true)
        }}
        onLater={() => {
          dismissPinSetupPrompt()
          setShowSetupPrompt(false)
        }}
      />
      <PinSetupModal
        open={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        mode="create"
        onSuccess={handlePinSetupSuccess}
      />
    </>
  )
}
