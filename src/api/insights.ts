import { apiRequest } from '@/api/client'

export type BudgetInsight = {
  summary: string
  actions: string[]
  source: 'ai' | 'deterministic'
}

export function generateBudgetInsight(householdId: string): Promise<BudgetInsight> {
  return apiRequest(`/households/${householdId}/insights/budget`, { method: 'POST' })
}
