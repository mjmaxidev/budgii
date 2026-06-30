import type { BudgetStatus } from '@/types'

export function getBudgetStatus(spent: number, limit: number, warningThreshold: number): BudgetStatus {
  if (spent > limit) return 'over'
  if (spent >= warningThreshold) return 'warning'
  return 'good'
}

export const statusColor: Record<BudgetStatus, string> = {
  good: '#16A34A',
  warning: '#FB8500',
  over: '#EF4444',
}

export const statusLabel: Record<BudgetStatus, string> = {
  good: 'On track',
  warning: 'Approaching limit',
  over: 'Over budget',
}
