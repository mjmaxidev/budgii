import { apiRequest } from '@/api/client'
import type { NotificationListResponse } from '@/api/types'

export async function listNotifications(householdId: string): Promise<NotificationListResponse> {
  return apiRequest<NotificationListResponse>(`/households/${householdId}/notifications`)
}
