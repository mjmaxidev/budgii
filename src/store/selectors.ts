import type { Expense, Period } from '@/types'
import { withinPeriod } from '@/utils/dates'
import { useStore } from './appStore'

export function expensesInPeriod(expenses: Expense[], period: Period): Expense[] {
  return expenses.filter((e) => withinPeriod(e.date, period))
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0)
}

export type Breakdown = { id: string; total: number; percent: number }

function buildBreakdown(map: Map<string, number>, grandTotal: number): Breakdown[] {
  return Array.from(map.entries())
    .map(([id, total]) => ({
      id,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function breakdownByCategory(expenses: Expense[]): Breakdown[] {
  const total = sumExpenses(expenses)
  const map = new Map<string, number>()
  for (const e of expenses) map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount)
  return buildBreakdown(map, total)
}

export function breakdownByTag(expenses: Expense[]): Breakdown[] {
  const total = sumExpenses(expenses)
  const map = new Map<string, number>()
  for (const e of expenses) {
    if (e.tagIds.length === 0) {
      map.set('untagged', (map.get('untagged') ?? 0) + e.amount)
    }
    for (const t of e.tagIds) map.set(t, (map.get(t) ?? 0) + e.amount)
  }
  return buildBreakdown(map, total)
}

export function breakdownByMember(expenses: Expense[]): Breakdown[] {
  const total = sumExpenses(expenses)
  const map = new Map<string, number>()
  for (const e of expenses) {
    const key = e.memberId ?? 'unassigned'
    map.set(key, (map.get(key) ?? 0) + e.amount)
  }
  return buildBreakdown(map, total)
}

/** Daily totals across the current month, for the bar chart. */
export function dailyTotalsThisMonth(expenses: Expense[]): { day: number; total: number }[] {
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const totals = Array.from({ length: days }, (_, i) => ({ day: i + 1, total: 0 }))
  for (const e of expenses) {
    const d = new Date(e.date)
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      totals[d.getDate() - 1].total += e.amount
    }
  }
  return totals
}

export type DailyCategorySegment = {
  categoryId: string
  amount: number
  percent: number
}

export type DailyCategoryBreakdown = {
  day: number
  total: number
  categories: DailyCategorySegment[]
}

/** Per-day category splits for the spending overview stacked bar chart. */
export function dailyCategoryBreakdownThisMonth(expenses: Expense[]): DailyCategoryBreakdown[] {
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const byDay = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    total: 0,
    categories: new Map<string, number>(),
  }))

  for (const e of expenses) {
    const d = new Date(e.date)
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue
    const slot = byDay[d.getDate() - 1]
    slot.total += e.amount
    slot.categories.set(e.categoryId, (slot.categories.get(e.categoryId) ?? 0) + e.amount)
  }

  return byDay.map(({ day, total, categories }) => ({
    day,
    total,
    categories: Array.from(categories.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount),
  }))
}

/** Hook: spent amount in a given period. */
export function useSpent(period: Period): number {
  return useStore((s) => sumExpenses(expensesInPeriod(s.expenses, period)))
}
