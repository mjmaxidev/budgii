import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/utils/cn'

const TAB_ROOTS = new Set(['/home', '/transactions', '/reports', '/settings'])

type Props = {
  children: React.ReactNode
}

export function PageTransition({ children }: Props) {
  const location = useLocation()
  const reduced = usePrefersReducedMotion()
  const prevPath = useRef(location.pathname)

  const isTabSwitch =
    TAB_ROOTS.has(location.pathname) && TAB_ROOTS.has(prevPath.current)

  useLayoutEffect(() => {
    prevPath.current = location.pathname
  }, [location.pathname])

  return (
    <div
      key={location.pathname}
      className={cn(
        'h-full',
        !reduced && (isTabSwitch ? 'motion-page-tab' : 'motion-page-push'),
      )}
    >
      {children}
    </div>
  )
}
