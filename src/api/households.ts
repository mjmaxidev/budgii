import { apiRequest } from '@/api/client'
import type {
  HouseholdBootstrapResponse,
  HouseholdListResponse,
  HouseholdMemberListResponse,
  HouseholdMemberResponse,
  HouseholdResponse,
  InviteListResponse,
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

export async function getHouseholdBootstrap(householdId: string): Promise<HouseholdBootstrapResponse> {
  return apiRequest<HouseholdBootstrapResponse>(`/households/${householdId}/bootstrap`)
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

export async function listInvites(householdId: string): Promise<InviteListResponse> {
  const params = new URLSearchParams({ household_id: householdId })
  return apiRequest<InviteListResponse>(`/households/invites?${params.toString()}`)
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await apiRequest<void>(`/households/invites/${inviteId}`, {
    method: 'DELETE',
  })
}

export async function listHouseholdMembers(householdId: string): Promise<HouseholdMemberListResponse> {
  return apiRequest<HouseholdMemberListResponse>(`/households/${householdId}/members`)
}

export async function updateHouseholdMember(
  householdId: string,
  userId: string,
  accessRole: Exclude<MemberAccessRole, 'admin'>,
  editorLevel?: EditorLevel,
): Promise<HouseholdMemberResponse> {
  return apiRequest<HouseholdMemberResponse>(`/households/${householdId}/members/${userId}`, {
    method: 'PATCH',
    body: {
      access_role: accessRole,
      editor_level: editorLevel,
    },
  })
}

export async function removeHouseholdMember(householdId: string, userId: string): Promise<void> {
  await apiRequest<void>(`/households/${householdId}/members/${userId}`, {
    method: 'DELETE',
  })
}
