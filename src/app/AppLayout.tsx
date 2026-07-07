import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLockProvider } from '@/components/security/AppLockProvider'

/**
 * Budgii is a phone-only app. In the packaged Electron window the viewport is
 * already 390px wide, but in a browser (dev / web build) the viewport can be any
 * width — so we constrain every route to a centered phone-width column. The body
 * background shows on either side like a device on a desk.
 */
export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div id="mobile-frame-root" className="safe-top safe-x relative mx-auto h-full w-full bg-bg sm:max-w-[390px]">
      <AppLockProvider>
        {children ?? <Outlet />}
      </AppLockProvider>
    </div>
  )
}
