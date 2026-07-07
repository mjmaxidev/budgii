import { apiRequest } from '@/api/client'
import type { Deal, WatchlistItem } from '@/types'

export type DealCheckResponse = {
  checked_at: string
  server_time: string
  sync_revision: number
  watchlist_items: WatchlistItem[]
  deals: Deal[]
}

export async function runDealCheck(householdId: string): Promise<DealCheckResponse> {
  return apiRequest<DealCheckResponse>(`/households/${householdId}/deals/check`, {
    method: 'POST',
  })
}
