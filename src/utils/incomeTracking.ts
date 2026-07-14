import type { FamilyMember, IncomeItem, IncomeSource, OngoingIncome } from '@/types'

export function defaultIncomeDate(year: number, month: number): string {
  const now = new Date()
  if (year === now.getFullYear() && month === now.getMonth()) return now.toISOString().slice(0, 10)
  return new Date(year, month, 1).toISOString().slice(0, 10)
}

export function incomeMembers(familyMembers: FamilyMember[], selectedIds: string[], included: boolean) {
  return familyMembers.filter((member) => selectedIds.includes(member.id) === included)
}

export function memberIncomeItems(items: IncomeItem[], memberId?: string) {
  return memberId ? items.filter((item) => item.memberId === memberId) : []
}

export function salaryIncomeSourceId(sources: IncomeSource[]): string {
  return (
    sources.find((source) => source.id === 'incsrc_salary' || source.name === 'Salary')?.id ??
    sources[0]?.id ??
    ''
  )
}

export function memberOngoingIncome(items: OngoingIncome[], memberId: string, sourceId: string) {
  return (
    items.find((item) => item.memberId === memberId && item.sourceId === sourceId) ??
    items.find((item) => item.memberId === memberId)
  )
}
