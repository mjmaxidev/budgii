import { apiRequest } from '@/api/client'
import type { BackgroundJobStatusResponse } from '@/api/types'

export async function getBackgroundJobStatus(householdId: string): Promise<BackgroundJobStatusResponse> {
  return apiRequest<BackgroundJobStatusResponse>(`/households/${householdId}/background-jobs`)
}
