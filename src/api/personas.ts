import { apiRequest } from '@/api/client'
import type { PersonaListResponse, PersonaResponse } from '@/api/types'

export async function listPersonas(householdId: string): Promise<PersonaListResponse> {
  const params = new URLSearchParams({ household_id: householdId })
  return apiRequest<PersonaListResponse>(`/personas?${params.toString()}`)
}

export async function createPersona(
  householdId: string,
  body: {
    name: string
    relationship?: string
    avatar?: string
    active?: boolean
    is_default?: boolean
  },
): Promise<PersonaResponse> {
  const params = new URLSearchParams({ household_id: householdId })
  return apiRequest<PersonaResponse>(`/personas?${params.toString()}`, {
    method: 'POST',
    body,
  })
}

export async function updatePersona(
  householdId: string,
  personaId: string,
  body: {
    name?: string
    relationship?: string
    avatar?: string
    active?: boolean
    is_default?: boolean
  },
): Promise<PersonaResponse> {
  const params = new URLSearchParams({ household_id: householdId })
  return apiRequest<PersonaResponse>(`/personas/${personaId}?${params.toString()}`, {
    method: 'PATCH',
    body,
  })
}

export async function deletePersona(householdId: string, personaId: string): Promise<void> {
  const params = new URLSearchParams({ household_id: householdId })
  await apiRequest<void>(`/personas/${personaId}?${params.toString()}`, {
    method: 'DELETE',
  })
}
