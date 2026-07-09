import { apiRequest } from '@/api/client'
import type { NotificationListResponse, NotificationReadResponse } from '@/api/types'

export async function listNotifications(householdId: string): Promise<NotificationListResponse> {
  return apiRequest<NotificationListResponse>(`/households/${householdId}/notifications`)
}

export async function markNotificationRead(
  householdId: string,
  notificationId: string,
): Promise<NotificationReadResponse> {
  return apiRequest<NotificationReadResponse>(
    `/households/${householdId}/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'PATCH' },
  )
}

export async function markAllNotificationsRead(
  householdId: string,
): Promise<{ read: boolean; count: number }> {
  return apiRequest<{ read: boolean; count: number }>(`/households/${householdId}/notifications/read-all`, {
    method: 'POST',
  })
}
