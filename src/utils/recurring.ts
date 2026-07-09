import type { RecurringTransaction } from '@/types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function dateOnly(value: Date = new Date()): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nextRecurringDate(
  transaction: Pick<
    RecurringTransaction,
    'frequency' | 'dayOfMonth' | 'dayOfWeek' | 'monthOfYear' | 'startDate' | 'enabled'
  >,
  from: Date = new Date(),
): string | undefined {
  if (transaction.enabled === false) return undefined

  const start = parseDateOnly(transaction.startDate)
  const searchStart = stripTime(from)
  if (start && start > searchStart) {
    searchStart.setTime(start.getTime())
  }

  for (let offset = 0; offset <= 366 * 5; offset += 1) {
    const candidate = addDays(searchStart, offset)
    if (isDueOn(transaction, candidate, start)) {
      return dateOnly(candidate)
    }
  }

  return undefined
}

export function recurringScheduleLabel(transaction: RecurringTransaction): string {
  const next = transaction.nextDueDate ?? nextRecurringDate(transaction)
  if (transaction.enabled === false) return 'Paused'
  if (!next) return 'Schedule incomplete'
  return `Next due ${formatShortDate(next)}`
}

export function formatShortDate(iso: string): string {
  const parsed = parseDateOnly(iso)
  if (!parsed) return iso
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isDueOn(
  transaction: Pick<
    RecurringTransaction,
    'frequency' | 'dayOfMonth' | 'dayOfWeek' | 'monthOfYear' | 'startDate' | 'enabled'
  >,
  candidate: Date,
  start: Date | undefined,
): boolean {
  if (transaction.enabled === false) return false
  if (start && candidate < start) return false

  if (transaction.frequency === 'daily') return true

  if (transaction.frequency === 'weekly' || transaction.frequency === 'biweekly') {
    const dayOfWeek = transaction.dayOfWeek ?? start?.getDay()
    if (dayOfWeek === undefined || candidate.getDay() !== dayOfWeek) return false
    if (transaction.frequency === 'weekly') return true
    const anchor = start ?? new Date(1970, 0, 5)
    return weeksBetween(anchor, candidate) % 2 === 0
  }

  if (transaction.frequency === 'monthly') {
    return isDueDayOfMonth(transaction.dayOfMonth, candidate)
  }

  if (transaction.frequency === 'quarterly' || transaction.frequency === 'yearly') {
    if (!isDueDayOfMonth(transaction.dayOfMonth, candidate)) return false
    const monthOfYear = transaction.monthOfYear ?? (start ? start.getMonth() + 1 : undefined)
    if (!monthOfYear) return false
    if (transaction.frequency === 'yearly') return candidate.getMonth() + 1 === monthOfYear
    return (candidate.getMonth() + 1 - monthOfYear) % 3 === 0
  }

  return false
}

function parseDateOnly(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? undefined : stripTime(parsed)
}

function stripTime(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function isDueDayOfMonth(dayOfMonth: number | undefined, value: Date): boolean {
  if (!dayOfMonth) return false
  return value.getDate() === Math.min(dayOfMonth, lastDayOfMonth(value))
}

function lastDayOfMonth(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate()
}

function weeksBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.floor((endUtc - startUtc) / (MS_PER_DAY * 7))
}
