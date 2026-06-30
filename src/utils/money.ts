export function formatMoney(amount: number, opts: { sign?: boolean; cents?: boolean } = {}): string {
  const { sign = false, cents = true } = opts
  const abs = Math.abs(amount)
  const str = cents
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(abs).toLocaleString('en-US')
  const prefix = sign ? (amount < 0 ? '-' : '') : amount < 0 ? '-' : ''
  return `${prefix}$${str}`
}

export function formatMoneyShort(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}
