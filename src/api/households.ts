import { apiRequest } from '@/api/client'
import type {
  HouseholdListResponse,
  HouseholdResponse,
  InviteResponse,
} from '@/api/types'
import type { EditorLevel, MemberAccessRole } from '@/types'

export async function listHouseholds(): Promise<HouseholdListResponse> {
  return apiRequest<HouseholdListResponse>('/households')
}

export async function createHousehold(name: string): Promise<HouseholdResponse> {
  return apiRequest<HouseholdResponse>('/households', {
    method: 'POST',
    body: { name },
  })
}

export async function joinHousehold(code: string): Promise<HouseholdResponse> {
  return apiRequest<HouseholdResponse>('/households/join', {
    method: 'POST',
    body: { code: code.replace(/\s+/g, '').toUpperCase() },
  })
}

export async function createInvite(
  contact: string,
  householdId: string,
  accessRole: MemberAccessRole = 'editor',
  editorLevel?: EditorLevel,
): Promise<InviteResponse> {
  return apiRequest<InviteResponse>('/households/invites', {
    method: 'POST',
    body: {
      contact,
      household_id: householdId,
      access_role: accessRole,
      editor_level: editorLevel,
    },
  })
}
