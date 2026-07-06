import type { EditorLevel, MemberAccessRole } from '@/types'

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type UserResponse = {
  id: string
  email: string
  name: string
  avatar: string | null
  auth_provider: string
}

export type HouseholdResponse = {
  id: string
  name: string
  access_role: MemberAccessRole
  editor_level: EditorLevel | null
  is_account_holder: boolean
}

export type HouseholdListResponse = {
  households: HouseholdResponse[]
}

export type InviteResponse = {
  code: string
  invite_url: string
  expires_at: string | null
  access_role: MemberAccessRole
  editor_level: EditorLevel | null
}

export type PersonaResponse = {
  id: string
  name: string
  relationship: string
  avatar: string
  active: boolean
  is_default: boolean
  has_app_access: boolean
  access_role: MemberAccessRole | null
  editor_level: EditorLevel | null
}

export type PersonaListResponse = {
  personas: PersonaResponse[]
}

export type SyncPullResponse = {
  household_id: string
  server_time: string
  revision: number
  snapshot: Record<string, unknown>
}

export type SyncPushResponse = {
  accepted: boolean
  server_time: string
  conflicts: string[]
}
