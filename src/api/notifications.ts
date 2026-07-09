import { apiRequest } from '@/api/client'
import type {
  DeviceTokenListResponse,
  DeviceTokenRegisterRequest,
  DeviceTokenResponse,
  NotificationListResponse,
  NotificationReadResponse,
} from '@/api/types'

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

export async function listDeviceTokens(householdId: string): Promise<DeviceTokenListResponse> {
  return apiRequest<DeviceTokenListResponse>(`/households/${householdId}/notifications/device-tokens`)
}

export async function registerDeviceToken(
  householdId: string,
  payload: DeviceTokenRegisterRequest,
): Promise<DeviceTokenResponse> {
  return apiRequest<DeviceTokenResponse>(`/households/${householdId}/notifications/device-tokens`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function unregisterDeviceToken(
  householdId: string,
  tokenId: string,
): Promise<DeviceTokenResponse> {
  return apiRequest<DeviceTokenResponse>(
    `/households/${householdId}/notifications/device-tokens/${tokenId}`,
    { method: 'DELETE' },
  )
}
