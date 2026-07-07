import { apiRequest } from '@/api/client'
import type { SpendingAlertEvaluationResponse } from '@/api/types'

export async function evaluateSpendingAlerts(
  householdId: string,
  date = new Date(),
): Promise<SpendingAlertEvaluationResponse> {
  return apiRequest<SpendingAlertEvaluationResponse>(`/households/${householdId}/spending-alerts/evaluate`, {
    method: 'POST',
    body: { date: date.toISOString() },
  })
}
