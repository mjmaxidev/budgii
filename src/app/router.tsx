import { createHashRouter, Navigate, RouteObject } from 'react-router-dom'
import type { ComponentType } from 'react'
import { AppLayout } from './AppLayout'
import { AuthGate } from '@/components/auth/AuthGate'

function lazyPage<T extends object, K extends keyof T>(load: () => Promise<T>, name: K) {
  return async () => ({ Component: (await load())[name] as ComponentType })
}

export type RouteMeta = {
  label?: string
  description?: string
  section?: 'app' | 'qa'
  hidden?: boolean
}

export type RouteWithMeta = RouteObject & {
  meta?: RouteMeta
}

export const appRoutes: RouteWithMeta[] = [
  { path: '/', element: <Navigate to="/home" replace /> },
  {
    path: '/home',
    lazy: lazyPage(() => import('@/pages/Home'), 'Home'),
    meta: { label: 'Home', description: 'Budget overview', section: 'app' },
  },
  {
    path: '/add-expense-choice',
    lazy: lazyPage(() => import('@/pages/AddExpenseChoice'), 'AddExpenseChoice'),
    meta: { label: 'Add Expense', description: 'Manual or scan', section: 'app' },
  },
  {
    path: '/add-expense',
    lazy: lazyPage(() => import('@/pages/AddExpense'), 'AddExpense'),
    meta: { label: 'Add Expense Form', description: 'Manual entry', section: 'app', hidden: true },
  },
  {
    path: '/scan-receipt',
    lazy: lazyPage(() => import('@/pages/ScanReceipt'), 'ScanReceipt'),
    meta: { label: 'Scan Receipt', description: 'Receipt capture', section: 'app' },
  },
  {
    path: '/receipt-results/:receiptId',
    lazy: lazyPage(() => import('@/pages/ReceiptResults'), 'ReceiptResults'),
    meta: { label: 'Receipt Results', description: 'AI item review', section: 'app', hidden: true },
  },
  {
    path: '/item/:itemId',
    lazy: lazyPage(() => import('@/pages/ItemDetail'), 'ItemDetail'),
    meta: { label: 'Item Detail', description: 'Source receipt', section: 'app', hidden: true },
  },
  {
    path: '/transaction-confirm',
    lazy: lazyPage(() => import('@/pages/TransactionConfirm'), 'TransactionConfirm'),
    meta: { hidden: true },
  },
  {
    path: '/transaction-confirm/:expenseId',
    lazy: lazyPage(() => import('@/pages/TransactionConfirm'), 'TransactionConfirm'),
    meta: { hidden: true },
  },
  {
    path: '/transactions',
    lazy: lazyPage(() => import('@/pages/Transactions'), 'Transactions'),
    meta: { label: 'Transactions', description: 'Expense rows', section: 'app' },
  },
  {
    path: '/reports',
    lazy: lazyPage(() => import('@/pages/ReportsBudget'), 'ReportsBudget'),
    meta: { label: 'Reports', description: 'Budget charts', section: 'app' },
  },
  {
    path: '/spending-breakdown',
    lazy: lazyPage(() => import('@/pages/SpendingBreakdown'), 'SpendingBreakdown'),
    meta: { label: 'Breakdown', description: 'Category details', section: 'app' },
  },
  {
    path: '/budget-setup',
    lazy: lazyPage(() => import('@/pages/BudgetSetup'), 'BudgetSetup'),
    meta: { label: 'Budget Setup', description: 'Budget form', section: 'app' },
  },
  {
    path: '/budget-next-month',
    lazy: lazyPage(() => import('@/pages/BudgetNextMonth'), 'BudgetNextMonth'),
    meta: { label: 'Plan Next Month', description: 'Forward budget planning', section: 'app' },
  },
  {
    path: '/categories-tags',
    lazy: lazyPage(() => import('@/pages/CategoriesTags'), 'CategoriesTags'),
    meta: { label: 'Categories', description: 'Tags setup', section: 'app' },
  },
  {
    path: '/family-members',
    lazy: lazyPage(() => import('@/pages/FamilyMembers'), 'FamilyMembers'),
    meta: { label: 'Family', description: 'Member tags', section: 'app' },
  },
  {
    path: '/settings',
    lazy: lazyPage(() => import('@/pages/Settings'), 'Settings'),
    meta: { label: 'Settings', description: 'Account groups', section: 'app' },
  },
  {
    path: '/deal-watchlist',
    lazy: lazyPage(() => import('@/pages/DealWatchlist'), 'DealWatchlist'),
    meta: { label: 'Watchlist', description: 'Tracked deals', section: 'app' },
  },
  {
    path: '/todays-deal-report',
    lazy: lazyPage(() => import('@/pages/TodaysDealReport'), 'TodaysDealReport'),
    meta: { label: 'Today Deals', description: 'Daily deals', section: 'app' },
  },
  {
    path: '/deal-cards',
    lazy: lazyPage(() => import('@/pages/DealCards'), 'DealCards'),
    meta: { label: 'Deal Cards', description: 'Swipe cards', section: 'app' },
  },
  {
    path: '/shopping-list',
    lazy: lazyPage(() => import('@/pages/ShoppingList'), 'ShoppingList'),
    meta: { label: 'Shopping List', description: 'Selected items', section: 'app' },
  },
  {
    path: '/onboarding',
    lazy: lazyPage(() => import('@/pages/OnBoarding'), 'OnBoarding'),
    meta: { label: 'OnBoarding', description: 'Setup flow', section: 'app' },
  },
  {
    path: '/account-settings',
    lazy: lazyPage(() => import('@/pages/AccountSettings'), 'AccountSettings'),
    meta: { label: 'Account', description: 'Profile & account settings', section: 'app' },
  },
  {
    path: '/active-sessions',
    lazy: lazyPage(() => import('@/pages/ActiveSessions'), 'ActiveSessions'),
    meta: { label: 'Sessions', description: 'Signed-in devices', section: 'app' },
  },
  {
    path: '/preferences',
    lazy: lazyPage(() => import('@/pages/Preferences'), 'Preferences'),
    meta: { label: 'Preferences', description: 'Currency, language, notifications', section: 'app' },
  },
  {
    path: '/income-tracking',
    lazy: lazyPage(() => import('@/pages/IncomeTracking'), 'IncomeTracking'),
    meta: { label: 'Income', description: 'Income log', section: 'app' },
  },
  {
    path: '/recurring-transactions',
    lazy: lazyPage(() => import('@/pages/RecurringTransactions'), 'RecurringTransactions'),
    meta: { label: 'Recurring', description: 'Scheduled items', section: 'app' },
  },
  {
    path: '/spending-alerts',
    lazy: lazyPage(() => import('@/pages/SpendingAlerts'), 'SpendingAlerts'),
    meta: { label: 'Alerts', description: 'Budget notifications', section: 'app' },
  },
  {
    path: '/family-invitation',
    lazy: lazyPage(() => import('@/pages/FamilyInvitation'), 'FamilyInvitation'),
    meta: { hidden: true },
  },
  {
    path: '/join-family',
    lazy: lazyPage(() => import('@/pages/FamilyJoin'), 'FamilyJoin'),
    meta: { label: 'Join Family', description: 'Redeem invite code', section: 'app' },
  },
  {
    path: '/monthly-summary',
    lazy: lazyPage(() => import('@/pages/MonthlySummary'), 'MonthlySummary'),
    meta: { label: 'Monthly Summary', description: 'Month overview', section: 'app' },
  },
  {
    path: '/receipt-history',
    lazy: lazyPage(() => import('@/pages/ReceiptHistory'), 'ReceiptHistory'),
    meta: { label: 'Receipt History', description: 'Past receipts', section: 'app' },
  },
  {
    path: '/receipt-viewer/:receiptId',
    lazy: lazyPage(() => import('@/pages/ReceiptImageViewer'), 'ReceiptImageViewer'),
    meta: { hidden: true },
  },
  {
    path: '/data-export',
    lazy: lazyPage(() => import('@/pages/DataExport'), 'DataExport'),
    meta: { label: 'Data Export', description: 'Export data', section: 'app' },
  },
  {
    path: '/help',
    lazy: lazyPage(() => import('@/pages/Help'), 'Help'),
    meta: { label: 'Help', description: 'Support', section: 'app' },
  },
  {
    path: '/background-jobs',
    lazy: lazyPage(() => import('@/pages/BackgroundJobs'), 'BackgroundJobs'),
    meta: { label: 'Background Jobs', description: 'Worker status', section: 'app' },
  },
  {
    path: '/budget-comparison',
    lazy: lazyPage(() => import('@/pages/BudgetComparison'), 'BudgetComparison'),
    meta: { label: 'Budget Comparison', description: 'Compare periods', section: 'app' },
  },
  {
    path: '/notifications',
    lazy: lazyPage(() => import('@/pages/Notifications'), 'Notifications'),
    meta: { label: 'Notifications', description: 'Updates', section: 'app' },
  },
  {
    path: '/login',
    lazy: lazyPage(() => import('@/pages/Login'), 'Login'),
    meta: { label: 'Login', description: 'Welcome / sign in', section: 'app', hidden: true },
  },
  {
    path: '/forgot-password',
    lazy: lazyPage(() => import('@/pages/ForgotPassword'), 'ForgotPassword'),
    meta: { label: 'Forgot Password', description: 'Request reset link', section: 'app', hidden: true },
  },
  {
    path: '/reset-password',
    lazy: lazyPage(() => import('@/pages/ResetPassword'), 'ResetPassword'),
    meta: { label: 'Reset Password', description: 'Set new password', section: 'app', hidden: true },
  },
  {
    path: '/verification',
    lazy: lazyPage(() => import('@/pages/Verification'), 'Verification'),
    meta: { label: 'Verification', description: 'Account verification', section: 'app' },
  },
  { path: '*', element: <Navigate to="/home" replace /> },
]

export const router = createHashRouter([
  {
    element: (
      <AppLayout>
        <AuthGate />
      </AppLayout>
    ),
    children: appRoutes as RouteObject[],
  },
])
