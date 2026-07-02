/**
 * Logical back destinations for Budgii screens.
 * Prefer `location.state.from` when set; otherwise use this map.
 */
export type AppNavigateState = {
  from?: string
}

export function withFrom(from: string): { state: AppNavigateState } {
  return { state: { from } }
}

const TAB_ROOTS = new Set(['/home', '/transactions', '/reports', '/settings'])

/** Main tab screens — back is hidden; use bottom nav instead. */
export function isTabRoot(pathname: string) {
  return TAB_ROOTS.has(pathname)
}

const EXACT_PARENT: Record<string, string> = {
  '/add-expense-choice': '/home',
  '/add-expense': '/add-expense-choice',
  '/scan-receipt': '/add-expense-choice',
  '/spending-breakdown': '/reports',
  '/budget-setup': '/settings',
  '/budget-next-month': '/reports',
  '/categories-tags': '/settings',
  '/category-create': '/categories-tags',
  '/tag-create': '/categories-tags',
  '/family-members': '/settings',
  '/family-invitation': '/family-members',
  '/join-family': '/login',
  '/account-settings': '/settings',
  '/preferences': '/settings',
  '/income-tracking': '/settings',
  '/recurring-transactions': '/settings',
  '/spending-alerts': '/settings',
  '/monthly-summary': '/settings',
  '/receipt-history': '/settings',
  '/data-export': '/settings',
  '/help': '/settings',
  '/budget-comparison': '/settings',
  '/notifications': '/home',
  '/deal-watchlist': '/settings',
  '/todays-deal-report': '/deal-watchlist',
  '/deal-cards': '/deal-watchlist',
  '/shopping-list': '/deal-cards',
  '/onboarding': '/login',
  '/verification': '/login',
  '/transaction-confirm': '/home',
}

const PATTERN_PARENT: Array<{ pattern: RegExp; parent: string | ((pathname: string) => string) }> = [
  { pattern: /^\/receipt-results\//, parent: '/scan-receipt' },
  {
    pattern: /^\/receipt-viewer\//,
    parent: (pathname) => {
      const id = pathname.split('/')[2]
      return id ? `/receipt-results/${id}` : '/receipt-history'
    },
  },
  { pattern: /^\/item\//, parent: '/receipt-history' },
]

function isAppPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
}

export function resolveBackPath(pathname: string, state: unknown): string {
  const from = (state as AppNavigateState | null)?.from
  if (from && isAppPath(from)) return from

  if (EXACT_PARENT[pathname]) return EXACT_PARENT[pathname]

  for (const { pattern, parent } of PATTERN_PARENT) {
    if (!pattern.test(pathname)) continue
    return typeof parent === 'function' ? parent(pathname) : parent
  }

  return '/home'
}
