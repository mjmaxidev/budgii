import type { IncomeItem, OngoingIncome } from '@/types'

export function getMonthRange(year: number, month: number) {
  const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { firstDay, lastDay }
}

export function incomeInMonth(items: IncomeItem[], year: number, month: number) {
  return items.filter((i) => {
    const d = new Date(i.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function sumIncomeItems(items: IncomeItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export function sumOngoingIncome(ongoing: OngoingIncome[]) {
  return ongoing.filter((o) => o.enabled).reduce((sum, o) => sum + o.amount, 0)
}

export function monthIncomeTotal(
  items: IncomeItem[],
  ongoing: OngoingIncome[],
  year: number,
  month: number,
) {
  return sumIncomeItems(incomeInMonth(items, year, month)) + sumOngoingIncome(ongoing)
}

export function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function isCurrentMonth(year: number, month: number) {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() === month
}
