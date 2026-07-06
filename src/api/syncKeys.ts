import type { AppStore } from '@/store/appStore'

export const SYNC_KEYS = [
  'categories',
  'tags',
  'receipts',
  'receiptItems',
  'budget',
  'watchlistItems',
  'deals',
  'shoppingList',
  'settings',
  'incomeSources',
  'incomeItems',
  'ongoingIncomes',
  'budgetGoals',
  'recurringTransactions',
  'spendingAlerts',
] as const satisfies readonly (keyof AppStore)[]

export type SyncKey = (typeof SYNC_KEYS)[number]

export function pickSyncSnapshot(state: AppStore): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {}
  for (const key of SYNC_KEYS) {
    snapshot[key] = state[key]
  }
  return snapshot
}
