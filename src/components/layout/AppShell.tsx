import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { BottomNav } from './BottomNav'

type Props = {
  children: ReactNode
  topBar?: ReactNode
  showBottomNav?: boolean
  fab?: ReactNode
  /** padding around scroll content */
  contentClassName?: string
  scrollClassName?: string
}

/**
 * Per-screen shell: fixed top bar, scrollable content, optional bottom nav + FAB.
 * Lives inside MobileFrame which constrains width/height.
 *
 * A bottom fade gradient appears whenever the content overflows and you're not
 * yet at the end — a scroll affordance so users know there's more below the fold.
 * It fades out automatically once you reach the bottom.
 */
export function AppShell({
  children,
  topBar,
  showBottomNav,
  fab,
  contentClassName,
  scrollClassName,
}: Props) {
  const scrollRef = useRef<HTMLElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    const overflows = el.scrollHeight > el.clientHeight + 4
    setCanScrollDown(overflows && !atBottom)
  }, [])

  useLayoutEffect(() => {
    update()
    const el = scrollRef.current
    if (!el) return
    // Re-measure when the viewport or content size changes (e.g. async data,
    // expanding sections, keyboard) so the hint stays accurate.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [update, children])

  return (
    <div className="relative flex h-full flex-col bg-bg">
      {topBar}
      <div className="relative min-h-0 flex-1">
        <main
          ref={scrollRef}
          onScroll={update}
          className={cn('no-scrollbar h-full overflow-y-auto', scrollClassName)}
        >
          <div className={cn('px-4 pb-6', contentClassName)}>{children}</div>
        </main>
        {/* Scroll-more fade — sits at the bottom of the scroll viewport. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/80 to-transparent transition-opacity duration-200',
            canScrollDown ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
      {fab}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
