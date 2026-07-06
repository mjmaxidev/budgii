import { apiRequest } from '@/api/client'
import type { SyncPullResponse, SyncPushResponse } from '@/api/types'

export async function pullSync(
  householdId: string,
  since?: string,
): Promise<SyncPullResponse> {
  const params = new URLSearchParams({ household_id: householdId })
  if (since) params.set('since', since)
  return apiRequest<SyncPullResponse>(`/sync?${params.toString()}`)
}

export async function pushSync(
  householdId: string,
  changes: Record<string, unknown>,
  baseRevision: number | null,
): Promise<SyncPushResponse> {
  return apiRequest<SyncPushResponse>('/sync', {
    method: 'POST',
    body: {
      household_id: householdId,
      client_time: new Date().toISOString(),
      base_revision: baseRevision,
      changes,
    },
  })
}
