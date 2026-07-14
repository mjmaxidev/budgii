import type { AppStore } from './appStore'
import type { IncomeItem, IncomeSource, OngoingIncome } from '@/types'
import { todayISO } from '@/utils/dates'
import { sumOngoingIncome } from '@/utils/income'
import { uid } from '@/utils/id'

const INCOME_COLORS = ['#FB8500', '#16A34A', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']

type SetState = (updater: (state: AppStore) => Partial<AppStore>) => void
type GetState = () => AppStore

export function createIncomeActions(
  set: SetState,
  get: GetState,
): Pick<
  AppStore,
  | 'addIncomeSource'
  | 'updateIncomeSource'
  | 'deleteIncomeSource'
  | 'addIncomeItem'
  | 'updateIncomeItem'
  | 'deleteIncomeItem'
  | 'addOngoingIncome'
  | 'updateOngoingIncome'
  | 'deleteOngoingIncome'
  | 'upsertOngoingIncome'
  | 'getIncomeItems'
  | 'getTotalIncome'
> {
  return {
    addIncomeSource: (name, color) => {
      const id = uid('incsrc')
      const source: IncomeSource = {
        id,
        name,
        color: color ?? INCOME_COLORS[get().incomeSources.length % INCOME_COLORS.length],
      }
      set((s) => ({ incomeSources: [...s.incomeSources, source] }))
      return id
    },

    updateIncomeSource: (id, patch) =>
      set((s) => ({
        incomeSources: s.incomeSources.map((source) => (source.id === id ? { ...source, ...patch } : source)),
      })),

    deleteIncomeSource: (id) => {
      const fallback = get().incomeSources.find((source) => source.id !== id)
      set((s) => ({
        incomeSources: s.incomeSources.filter((source) => source.id !== id),
        incomeItems: fallback
          ? s.incomeItems.map((item) => (item.sourceId === id ? { ...item, sourceId: fallback.id } : item))
          : s.incomeItems,
      }))
    },

    addIncomeItem: (item) => {
      if (!item.memberId) return ''
      const id = item.id ?? uid('inc')
      const incomeItem: IncomeItem = {
        id,
        date: item.date ?? todayISO(),
        sourceId: item.sourceId ?? get().incomeSources[0]?.id ?? '',
        amount: item.amount ?? 0,
        memberId: item.memberId,
        notes: item.notes,
      }
      set((s) => ({ incomeItems: [incomeItem, ...s.incomeItems] }))
      return id
    },

    updateIncomeItem: (id, patch) => {
      if ('memberId' in patch && !patch.memberId) return
      set((s) => ({
        incomeItems: s.incomeItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }))
    },

    deleteIncomeItem: (id) => set((s) => ({ incomeItems: s.incomeItems.filter((item) => item.id !== id) })),

    addOngoingIncome: (item) => {
      if (!item.memberId) return ''
      const id = item.id ?? uid('oinc')
      const entry: OngoingIncome = {
        id,
        sourceId: item.sourceId ?? get().incomeSources[0]?.id ?? '',
        amount: item.amount ?? 0,
        memberId: item.memberId,
        notes: item.notes,
        enabled: item.enabled ?? true,
      }
      set((s) => ({ ongoingIncomes: [...s.ongoingIncomes, entry] }))
      return id
    },

    updateOngoingIncome: (id, patch) => {
      if ('memberId' in patch && !patch.memberId) return
      set((s) => ({
        ongoingIncomes: s.ongoingIncomes.map((income) =>
          income.id === id ? { ...income, ...patch } : income,
        ),
      }))
    },

    deleteOngoingIncome: (id) =>
      set((s) => ({ ongoingIncomes: s.ongoingIncomes.filter((income) => income.id !== id) })),

    upsertOngoingIncome: ({ sourceId, amount, memberId, notes }) => {
      if (!memberId) return ''
      const existing = get().ongoingIncomes.find(
        (income) => income.sourceId === sourceId && income.memberId === memberId,
      )
      if (existing) {
        get().updateOngoingIncome(existing.id, { amount, notes, enabled: true })
        return existing.id
      }
      return get().addOngoingIncome({ sourceId, amount, memberId, notes, enabled: true })
    },

    getIncomeItems: (startDate, endDate) =>
      get().incomeItems.filter((item) => item.date >= startDate && item.date <= endDate),

    getTotalIncome: (startDate, endDate) =>
      get()
        .getIncomeItems(startDate, endDate)
        .reduce((sum, item) => sum + item.amount, 0) + sumOngoingIncome(get().ongoingIncomes),
  }
}
