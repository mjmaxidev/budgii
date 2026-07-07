export type Category = {
  id: string
  name: string
  icon: string
  color: string
}

export type Tag = {
  id: string
  name: string
  color: string
}

export type MemberAccessRole = 'admin' | 'editor' | 'viewer'
export type EditorLevel = 'full' | 'standard' | 'limited'

export type FamilyMember = {
  id: string
  name: string
  relationship: 'You' | 'Husband' | 'Child 1' | 'Child 2' | 'Child 3' | string
  avatar: string
  active: boolean
  isDefault?: boolean
  /** Account creator — always admin */
  isAccountHolder?: boolean
  /** Can sign in and use the household in the app */
  hasAppAccess?: boolean
  accessRole?: MemberAccessRole
  editorLevel?: EditorLevel
}

export type Expense = {
  id: string
  amount: number
  date: string
  merchant: string
  categoryId: string
  tagIds: string[]
  memberId?: string
  notes?: string
  receiptId?: string
  source: 'manual' | 'receipt_ai'
}

export type ReceiptStatus = 'uploaded' | 'analyzing' | 'needs_review' | 'processed' | 'failed'

export type Receipt = {
  id: string
  uploadId?: string
  merchant: string
  date: string
  total: number
  imageUrl?: string
  ocrText?: string
  itemIds: string[]
  status: ReceiptStatus
  analysisError?: string
}

export type ReceiptItem = {
  id: string
  receiptId: string
  name: string
  amount: number
  categoryId: string
  tagIds: string[]
  memberId?: string
  aiConfidence: number
  manuallyEdited?: boolean
}

export type BudgetPeriod = 'monthly' | 'weekly' | 'daily'

export type Budget = {
  id: string
  period: BudgetPeriod
  limit: number
  warningThreshold: number
  categoryAllocations: Record<string, number>
  warningNotifications: boolean
  overBudgetAlerts: boolean
}

export type WatchlistStatus = 'watching' | 'on_sale' | 'new_deal'

export type WatchlistItem = {
  id: string
  name: string
  merchant: string
  imageUrl?: string
  targetPrice?: number
  currentPrice?: number
  originalPrice?: number
  status: WatchlistStatus
  lastCheckedAt?: string
}

export type DealActionStatus = 'new' | 'added_to_shopping_list' | 'skipped' | 'keep_watching'

export type Deal = {
  id: string
  watchlistItemId: string
  name: string
  merchant: string
  imageUrl?: string
  originalPrice: number
  salePrice: number
  discountPercent: number
  foundAt: string
  actionStatus: DealActionStatus
}

export type ShoppingListItem = {
  id: string
  dealId?: string
  name: string
  merchant?: string
  expectedPrice?: number
  checked: boolean
  date: string
}

export type BudgetStatus = 'good' | 'warning' | 'over'
export type Period = 'daily' | 'weekly' | 'monthly'

// ── Extended store types ────────────────────────────────────────────

export type IncomeSource = {
  id: string
  name: string
  color: string
}

export type IncomeItem = {
  id: string
  date: string
  sourceId: string
  amount: number
  memberId?: string
  notes?: string
}

/** Stable monthly income — counted every month while enabled */
export type OngoingIncome = {
  id: string
  sourceId: string
  amount: number
  memberId?: string
  notes?: string
  enabled: boolean
}

export type UserProfile = {
  name: string
  email: string
  avatar?: string
  preferences: {
    currency: string
    theme: 'light' | 'dark' | 'auto'
    notifications: boolean
    language: string
  }
}

export type BudgetGoal = {
  id: string
  categoryId: string
  targetAmount: number
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export type RecurringTransaction = {
  id: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  dayOfMonth?: number
  dayOfWeek?: number
  expense: Partial<Expense>
}

export type SpendingAlert = {
  id: string
  categoryId: string
  threshold: number
  alertType: 'percentage' | 'amount'
}

export type FamilyInvite = {
  id: string
  code: string
  createdAt: string
  usedAt?: string
  usedBy?: string
  sentToContact?: string
  sentAt?: string
  accessRole: MemberAccessRole
  editorLevel?: EditorLevel
}

export type AppLockState = {
  pinHash: string | null
  pinSalt: string | null
  /** Show one-time setup prompt after onboarding */
  pendingSetupPrompt: boolean
}
