import type { Period } from '@/types'

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} • ${time}`
}

export function todayISO(): string {
  return new Date().toISOString()
}

export function monthLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Whether `iso` falls within the period ending "now" (relative to reference date). */
export function withinPeriod(iso: string, period: Period, reference: Date = new Date()): boolean {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return false
  if (period === 'daily') {
    return d.toDateString() === reference.toDateString()
  }
  if (period === 'weekly') {
    const diff = (reference.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff < 7
  }
  // monthly
  return d.getMonth() === reference.getMonth() && d.getFullYear() === reference.getFullYear()
}
