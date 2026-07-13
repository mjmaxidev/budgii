import type { EditorLevel, MemberAccessRole, RecurringTransaction } from '@/types'

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
  email_verified_at: string | null
}

export type AuthActionResponse = {
  ok: boolean
}

export type UpdateUserInput = {
  email?: string
  name?: string
  avatar?: string | null
}

export type SessionResponse = {
  id: string
  user_agent: string | null
  ip_address: string | null
  created_at: string
  last_used_at: string | null
  expires_at: string
}

export type SessionListResponse = {
  sessions: SessionResponse[]
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

export type HouseholdMemberResponse = {
  user_id: string
  persona_id: string | null
  name: string
  email: string
  avatar: string | null
  access_role: MemberAccessRole
  editor_level: EditorLevel | null
  is_account_holder: boolean
  joined_at: string
}

export type HouseholdMemberListResponse = {
  members: HouseholdMemberResponse[]
}

export type InviteResponse = {
  id: string | null
  code: string
  invite_url: string
  expires_at: string | null
  access_role: MemberAccessRole
  editor_level: EditorLevel | null
  sent_to_contact: string | null
  sent_at: string | null
  used_at: string | null
  used_by: string | null
}

export type InviteListResponse = {
  invites: InviteResponse[]
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

export type ExpenseResponse = {
  id: string
  household_id: string
  persona_id: string | null
  category_id: string
  amount: number
  date: string
  merchant: string
  tag_ids: string[]
  notes: string | null
  receipt_upload_id: string | null
  receipt_id: string | null
  source: 'manual' | 'receipt_ai' | 'recurring' | string
  created_at: string
  updated_at: string
}

export type ExpenseListResponse = {
  expenses: ExpenseResponse[]
  limit: number
  offset: number
  total: number
}

export type SpendingAlertEvaluation = {
  id: string
  category_id: string
  alert_type: 'amount' | 'percentage' | string
  threshold: number
  spent: number
  limit: number | null
  progress: number
  active: boolean
}

export type SpendingAlertEvaluationResponse = {
  period_start: string
  period_end: string
  active_count: number
  alerts: SpendingAlertEvaluation[]
}

export type NotificationResponse = {
  id: string
  type: 'price_drop' | 'budget_warning' | 'budget_exceeded' | 'deal_found' | string
  title: string
  description: string
  timestamp: string
  icon: 'trending_down' | 'alert' | 'gift' | string
  read: boolean
}

export type NotificationListResponse = {
  notifications: NotificationResponse[]
}

export type NotificationReadResponse = {
  notification_id: string
  read: boolean
}

export type DevicePlatform = 'ios' | 'android' | 'web'

export type DeviceTokenRegisterRequest = {
  token: string
  platform: DevicePlatform
  device_id?: string | null
  app_version?: string | null
}

export type DeviceTokenResponse = {
  id: string
  platform: string
  device_id: string | null
  app_version: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export type DeviceTokenListResponse = {
  tokens: DeviceTokenResponse[]
}

export type BackgroundJobRunResponse = {
  id: string
  job_name: 'recurring' | 'push' | string
  status: 'success' | 'failed' | string
  started_at: string
  finished_at: string
  summary: Record<string, unknown> | null
  error: string | null
}

export type BackgroundJobStatusResponse = {
  runs: BackgroundJobRunResponse[]
}

export type ApplyRecurringResponse = {
  expenses: ExpenseResponse[]
  applied_count: number
  skipped_count: number
  applied_recurring_ids: string[]
  recurring_transactions: RecurringTransaction[]
}

export type RecurringPreviewItem = {
  recurring_id: string
  merchant: string
  amount: number
  category_id: string
  due_date: string
  next_due_date: string | null
}

export type PreviewRecurringResponse = {
  items: RecurringPreviewItem[]
  due_count: number
  skipped_count: number
}

export type ReceiptUploadResponse = {
  id: string
  status: string
  filename: string
}

export type ReceiptResponse = {
  id: string
  household_id: string
  upload_id: string | null
  merchant: string
  date: string
  total: number
  image_url: string | null
  ocr_text: string | null
  status: 'uploaded' | 'analyzing' | 'needs_review' | 'processed' | 'failed' | string
  analysis_error: string | null
  item_ids: string[]
  created_at: string
  updated_at: string
}

export type ReceiptListResponse = {
  receipts: ReceiptResponse[]
  limit: number
  offset: number
  total: number
}

export type ReceiptItemResponse = {
  id: string
  receipt_id: string
  name: string
  amount: number
  category_id: string
  tag_ids: string[]
  persona_id: string | null
  ai_confidence: number
  manually_edited: boolean
  created_at: string
  updated_at: string
}

export type ReceiptItemListResponse = {
  items: ReceiptItemResponse[]
}

export type ReceiptAnalyzeResponse = {
  receipt: ReceiptResponse
  items: ReceiptItemResponse[]
}

export type ReceiptStatusResponse = {
  id: string
  status: 'uploaded' | 'analyzing' | 'needs_review' | 'processed' | 'failed' | string
  analysis_error: string | null
  item_count: number
  updated_at: string
}

export type SyncPullResponse = {
  household_id: string
  server_time: string
  revision: number
  snapshot: Record<string, unknown>
}

export type HouseholdBootstrapResponse = {
  household: HouseholdResponse
  members: HouseholdMemberResponse[]
  personas: PersonaResponse[]
  invites: InviteResponse[]
  server_time: string
  revision: number
  snapshot: Record<string, unknown>
}

export type SyncPushResponse = {
  accepted: boolean
  server_time: string
  conflicts: string[]
}
