/**
 * Pure-data list of the app's visible pages, used by the QA studio's nav rail.
 *
 * This is deliberately *data only* (no component imports) so the QA bundle never
 * pulls in the app's page modules — the app itself runs inside the QA iframe. It
 * mirrors the visible (`section: 'app'`, not `hidden`) entries of `appRoutes` in
 * src/app/router.tsx; keep the two in sync when adding or renaming a page.
 */
export type AppPage = {
  /** Hash path inside the app, e.g. "/home" — drives the iframe's location.hash. */
  path: string
  label: string
  description: string
}

export const appPages: AppPage[] = [
  { path: '/home', label: 'Home', description: 'Budget overview' },
  { path: '/add-expense-choice', label: 'Add Expense', description: 'Manual or scan' },
  { path: '/add-expense', label: 'Add Expense Form', description: 'Manual entry' },
  { path: '/scan-receipt', label: 'Scan Receipt', description: 'Receipt capture' },
  { path: '/transactions', label: 'Transactions', description: 'Expense rows' },
  { path: '/reports', label: 'Reports', description: 'Budget charts' },
  { path: '/spending-breakdown', label: 'Breakdown', description: 'Category details' },
  { path: '/budget-setup', label: 'Budget Setup', description: 'Budget form' },
  { path: '/categories-tags', label: 'Categories', description: 'Tags setup' },
  { path: '/family-members', label: 'Family', description: 'Member tags' },
  { path: '/settings', label: 'Settings', description: 'Account groups' },
  { path: '/deal-watchlist', label: 'Watchlist', description: 'Tracked deals' },
  { path: '/todays-deal-report', label: 'Today Deals', description: 'Daily deals' },
  { path: '/deal-cards', label: 'Deal Cards', description: 'Swipe cards' },
  { path: '/shopping-list', label: 'Shopping List', description: 'Selected items' },
  { path: '/onboarding', label: 'OnBoarding', description: 'Setup flow' },
  { path: '/account-settings', label: 'Account', description: 'Profile & account settings' },
  { path: '/preferences', label: 'Preferences', description: 'Currency, language, notifications' },
  { path: '/income-tracking', label: 'Income', description: 'Income log' },
  { path: '/recurring-transactions', label: 'Recurring', description: 'Scheduled items' },
  { path: '/spending-alerts', label: 'Alerts', description: 'Budget notifications' },
  { path: '/monthly-summary', label: 'Monthly Summary', description: 'Month overview' },
  { path: '/receipt-history', label: 'Receipt History', description: 'Past receipts' },
  { path: '/data-export', label: 'Data Export', description: 'Export data' },
  { path: '/help', label: 'Help', description: 'Support' },
  { path: '/budget-comparison', label: 'Budget Comparison', description: 'Compare periods' },
  { path: '/notifications', label: 'Notifications', description: 'Updates' },
  { path: '/verification', label: 'Verification', description: 'Account verification' },
]
