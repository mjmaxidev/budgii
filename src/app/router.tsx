import { createHashRouter, Navigate, RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthGate } from '@/components/auth/AuthGate'
import { Login } from '@/pages/Login'
import { Verification } from '@/pages/Verification'
import { OnBoarding } from '@/pages/OnBoarding'
import { Home } from '@/pages/Home'
import { AddExpense } from '@/pages/AddExpense'
import { AddExpenseChoice } from '@/pages/AddExpenseChoice'
import { ScanReceipt } from '@/pages/ScanReceipt'
import { ReceiptResults } from '@/pages/ReceiptResults'
import { ReceiptHistory } from '@/pages/ReceiptHistory'
import { ItemDetail } from '@/pages/ItemDetail'
import { TransactionConfirm } from '@/pages/TransactionConfirm'
import { Transactions } from '@/pages/Transactions'
import { ReportsBudget } from '@/pages/ReportsBudget'
import { SpendingBreakdown } from '@/pages/SpendingBreakdown'
import { BudgetSetup } from '@/pages/BudgetSetup'
import { BudgetNextMonth } from '@/pages/BudgetNextMonth'
import { CategoriesTags } from '@/pages/CategoriesTags'
import { CategoryCreation } from '@/pages/CategoryCreation'
import { TagCreation } from '@/pages/TagCreation'
import { FamilyMembers } from '@/pages/FamilyMembers'
import { Settings } from '@/pages/Settings'
import { DealWatchlist } from '@/pages/DealWatchlist'
import { TodaysDealReport } from '@/pages/TodaysDealReport'
import { DealCards } from '@/pages/DealCards'
import { ShoppingList } from '@/pages/ShoppingList'
import { FamilyInvitation } from '@/pages/FamilyInvitation'
import { FamilyJoin } from '@/pages/FamilyJoin'
import { AccountSettings } from '@/pages/AccountSettings'
import { Preferences } from '@/pages/Preferences'
import { IncomeTracking } from '@/pages/IncomeTracking'
import { RecurringTransactions } from '@/pages/RecurringTransactions'
import { SpendingAlerts } from '@/pages/SpendingAlerts'
import { MonthlySummary } from '@/pages/MonthlySummary'
import { ReceiptImageViewer } from '@/pages/ReceiptImageViewer'
import { DataExport } from '@/pages/DataExport'
import { Help } from '@/pages/Help'
import { BudgetComparison } from '@/pages/BudgetComparison'
import { Notifications } from '@/pages/Notifications'

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
  { path: '/home', element: <Home />, meta: { label: 'Home', description: 'Budget overview', section: 'app' } },
  { path: '/add-expense-choice', element: <AddExpenseChoice />, meta: { label: 'Add Expense', description: 'Manual or scan', section: 'app' } },
  { path: '/add-expense', element: <AddExpense />, meta: { label: 'Add Expense Form', description: 'Manual entry', section: 'app', hidden: true } },
  { path: '/scan-receipt', element: <ScanReceipt />, meta: { label: 'Scan Receipt', description: 'Receipt capture', section: 'app' } },
  { path: '/receipt-results/:receiptId', element: <ReceiptResults />, meta: { label: 'Receipt Results', description: 'AI item review', section: 'app', hidden: true } },
  { path: '/item/:itemId', element: <ItemDetail />, meta: { label: 'Item Detail', description: 'Source receipt', section: 'app', hidden: true } },
  { path: '/transaction-confirm', element: <TransactionConfirm />, meta: { hidden: true } },
  { path: '/transactions', element: <Transactions />, meta: { label: 'Transactions', description: 'Expense rows', section: 'app' } },
  { path: '/reports', element: <ReportsBudget />, meta: { label: 'Reports', description: 'Budget charts', section: 'app' } },
  { path: '/spending-breakdown', element: <SpendingBreakdown />, meta: { label: 'Breakdown', description: 'Category details', section: 'app' } },
  { path: '/budget-setup', element: <BudgetSetup />, meta: { label: 'Budget Setup', description: 'Budget form', section: 'app' } },
  { path: '/budget-next-month', element: <BudgetNextMonth />, meta: { label: 'Plan Next Month', description: 'Forward budget planning', section: 'app' } },
  { path: '/categories-tags', element: <CategoriesTags />, meta: { label: 'Categories', description: 'Tags setup', section: 'app' } },
  { path: '/family-members', element: <FamilyMembers />, meta: { label: 'Family', description: 'Member tags', section: 'app' } },
  { path: '/settings', element: <Settings />, meta: { label: 'Settings', description: 'Account groups', section: 'app' } },
  { path: '/deal-watchlist', element: <DealWatchlist />, meta: { label: 'Watchlist', description: 'Tracked deals', section: 'app' } },
  { path: '/todays-deal-report', element: <TodaysDealReport />, meta: { label: 'Today Deals', description: 'Daily deals', section: 'app' } },
  { path: '/deal-cards', element: <DealCards />, meta: { label: 'Deal Cards', description: 'Swipe cards', section: 'app' } },
  { path: '/shopping-list', element: <ShoppingList />, meta: { label: 'Shopping List', description: 'Selected items', section: 'app' } },
  { path: '/onboarding', element: <OnBoarding />, meta: { label: 'OnBoarding', description: 'Setup flow', section: 'app' } },
  { path: '/account-settings', element: <AccountSettings />, meta: { label: 'Account', description: 'Profile & account settings', section: 'app' } },
  { path: '/preferences', element: <Preferences />, meta: { label: 'Preferences', description: 'Currency, language, notifications', section: 'app' } },
  { path: '/income-tracking', element: <IncomeTracking />, meta: { label: 'Income', description: 'Income log', section: 'app' } },
  { path: '/recurring-transactions', element: <RecurringTransactions />, meta: { label: 'Recurring', description: 'Scheduled items', section: 'app' } },
  { path: '/spending-alerts', element: <SpendingAlerts />, meta: { label: 'Alerts', description: 'Budget notifications', section: 'app' } },
  { path: '/family-invitation', element: <FamilyInvitation />, meta: { hidden: true } },
  { path: '/join-family', element: <FamilyJoin />, meta: { label: 'Join Family', description: 'Redeem invite code', section: 'app' } },
  { path: '/monthly-summary', element: <MonthlySummary />, meta: { label: 'Monthly Summary', description: 'Month overview', section: 'app' } },
  { path: '/receipt-history', element: <ReceiptHistory />, meta: { label: 'Receipt History', description: 'Past receipts', section: 'app' } },
  { path: '/receipt-viewer/:receiptId', element: <ReceiptImageViewer />, meta: { hidden: true } },
  { path: '/data-export', element: <DataExport />, meta: { label: 'Data Export', description: 'Export data', section: 'app' } },
  { path: '/help', element: <Help />, meta: { label: 'Help', description: 'Support', section: 'app' } },
  { path: '/budget-comparison', element: <BudgetComparison />, meta: { label: 'Budget Comparison', description: 'Compare periods', section: 'app' } },
  { path: '/category-create', element: <CategoryCreation />, meta: { hidden: true } },
  { path: '/tag-create', element: <TagCreation />, meta: { hidden: true } },
  { path: '/notifications', element: <Notifications />, meta: { label: 'Notifications', description: 'Updates', section: 'app' } },
  { path: '/login', element: <Login />, meta: { label: 'Login', description: 'Welcome / sign in', section: 'app', hidden: true } },
  { path: '/verification', element: <Verification />, meta: { label: 'Verification', description: 'Account verification', section: 'app' } },
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

