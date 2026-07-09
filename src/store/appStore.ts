import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Budget,
  Category,
  Deal,
  EditorLevel,
  Expense,
  FamilyMember,
  MemberAccessRole,
  IncomeItem,
  IncomeSource,
  OngoingIncome,
  Receipt,
  ReceiptItem,
  ShoppingListItem,
  Tag,
  WatchlistItem,
  AppLockState,
} from '@/types'
import {
  seedBudget,
  seedCategories,
  seedDeals,
  seedExpenses,
  seedFamilyMembers,
  seedIncomeSources,
  seedReceiptItems,
  seedReceipts,
  seedShoppingList,
  seedTags,
  seedWatchlistItems,
} from '@/data/seed'
import { uid } from '@/utils/id'
import { todayISO } from '@/utils/dates'
import { mockExtractReceiptItems } from '@/utils/mockAi'
import { generateSalt, hashPin, verifyPin } from '@/utils/pin'
import { sumOngoingIncome } from '@/utils/income'
import { normalizeInviteCode } from '@/utils/familyInvite'
import { defaultEditorLevel, normalizeEditorLevel } from '@/utils/memberAccess'

const TAG_PALETTE = ['#FB8500', '#16A34A', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']
const CAT_PALETTE = ['#16A34A', '#FB8500', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']
const CAT_ICONS = ['🛒', '🍽️', '🚗', '🛍️', '📄', '❤️', '⭐', '🎁', '✈️', '🏠']

// ── New types for extended store ────────────────────────────────────────

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
  monthOfYear?: number
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

export type AppStore = {
  categories: Category[]
  tags: Tag[]
  familyMembers: FamilyMember[]
  expenses: Expense[]
  receipts: Receipt[]
  receiptItems: ReceiptItem[]
  budget: Budget
  watchlistItems: WatchlistItem[]
  deals: Deal[]
  shoppingList: ShoppingListItem[]
  settings: {
    useMembersAsTags: boolean
    suggestMemberFromHistory: boolean
    currency: string
    defaultReportView: 'daily' | 'weekly' | 'monthly'
    /** Family members shown on Income Tracking — does not delete household members */
    incomeMemberIds: string[]
    notificationsEnabled: boolean
    alertTypeAmount: boolean
    alertTypePercentage: boolean
  }

  // Extended store state
  incomeSources: IncomeSource[]
  incomeItems: IncomeItem[]
  ongoingIncomes: OngoingIncome[]
  userProfile: UserProfile
  budgetGoals: BudgetGoal[]
  recurringTransactions: RecurringTransaction[]
  spendingAlerts: SpendingAlert[]
  familyInvites: FamilyInvite[]
  appLock: AppLockState

  // ── Existing methods ────────────────────────────────────────────────

  // Expenses
  addExpense: (input: Partial<Expense>) => string
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  getExpensesBetween: (startDate: string, endDate: string) => Expense[]
  getExpensesByCategory: (categoryId: string) => Expense[]
  getExpensesByMember: (memberId: string) => Expense[]

  // Receipts
  addReceipt: (merchant: string, date: string, total: number, imageUrl?: string) => string
  updateReceipt: (id: string, patch: Partial<Receipt>) => void
  deleteReceipt: (id: string) => void
  analyzeReceipt: (receiptId: string) => void
  confirmReceiptItems: (receiptId: string) => void
  addReceiptItem: (receiptId: string, item: Partial<Omit<ReceiptItem, 'id' | 'receiptId'>>) => void
  updateReceiptItem: (id: string, patch: Partial<ReceiptItem>) => void
  removeReceiptItem: (id: string) => void

  // Categories
  addCategory: (name: string, icon?: string, color?: string) => string
  updateCategory: (id: string, patch: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // Tags
  addTag: (name: string, color?: string) => string
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void

  // Family Members
  addFamilyMember: (member: Partial<FamilyMember>) => string
  updateFamilyMember: (id: string, patch: Partial<FamilyMember>) => void
  deleteFamilyMember: (id: string) => void

  addMemberToIncomePicker: (id: string) => void
  removeMembersFromIncomePicker: (ids: string[]) => void

  // Settings
  updateSettings: (patch: Partial<AppStore['settings']>) => void

  // Watchlist & Deals
  addWatchlistItem: (item: Partial<WatchlistItem>) => void
  removeWatchlistItem: (id: string) => void
  runLocalDealCheck: () => void
  addDealToShoppingList: (dealId: string) => void
  skipDeal: (dealId: string) => void
  keepWatchingDeal: (dealId: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  addShoppingItem: (item: {
    name: string
    merchant?: string
    expectedPrice?: number
    categoryId?: string
  }) => void

  // ── New store methods ────────────────────────────────────────────────

  // Income
  addIncomeSource: (name: string, color?: string) => string
  updateIncomeSource: (id: string, patch: Partial<IncomeSource>) => void
  deleteIncomeSource: (id: string) => void
  addIncomeItem: (item: Partial<IncomeItem>) => string
  updateIncomeItem: (id: string, patch: Partial<IncomeItem>) => void
  deleteIncomeItem: (id: string) => void
  addOngoingIncome: (item: Partial<OngoingIncome>) => string
  updateOngoingIncome: (id: string, patch: Partial<OngoingIncome>) => void
  deleteOngoingIncome: (id: string) => void
  upsertOngoingIncome: (item: {
    sourceId: string
    amount: number
    memberId?: string
    notes?: string
  }) => string
  getIncomeItems: (startDate: string, endDate: string) => IncomeItem[]
  getTotalIncome: (startDate: string, endDate: string) => number

  // User Profile
  setUserProfile: (profile: Partial<UserProfile>) => void
  updateUserPreferences: (preferences: Partial<UserProfile['preferences']>) => void

  // Budget
  updateBudget: (patch: Partial<Budget>) => void

  // Budget Goals
  addBudgetGoal: (goal: Partial<BudgetGoal>) => string
  updateBudgetGoal: (id: string, patch: Partial<BudgetGoal>) => void
  deleteBudgetGoal: (id: string) => void

  // Recurring Transactions
  addRecurringTransaction: (transaction: Partial<RecurringTransaction>) => string
  updateRecurringTransaction: (id: string, patch: Partial<RecurringTransaction>) => void
  deleteRecurringTransaction: (id: string) => void

  // Spending Alerts
  addSpendingAlert: (alert: Partial<SpendingAlert>) => string
  updateSpendingAlert: (id: string, patch: Partial<SpendingAlert>) => void
  deleteSpendingAlert: (id: string) => void
  getSpendingAlertsByCategory: (categoryId: string) => SpendingAlert[]
  getAllSpendingAlerts: () => SpendingAlert[]

  // Family Invites
  createFamilyInvite: (accessRole?: MemberAccessRole, editorLevel?: EditorLevel) => string
  useFamilyInvite: (code: string, usedBy: string) => boolean
  findFamilyInvite: (code: string) => FamilyInvite | undefined
  getFamilyInvites: () => FamilyInvite[]
  getUnusedInvites: () => FamilyInvite[]
  revokeFamilyInvite: (id: string) => void
  sendFamilyInvite: (code: string, contact: string) => void
  updateFamilyInvite: (code: string, patch: Partial<Pick<FamilyInvite, 'accessRole' | 'editorLevel'>>) => void

  // App lock (PIN)
  setAppPin: (pin: string) => Promise<void>
  changeAppPin: (currentPin: string, newPin: string) => Promise<{ ok: boolean; error?: string }>
  clearAppPin: () => void
  verifyAppPin: (pin: string) => Promise<boolean>
  triggerPinSetupPrompt: () => void
  dismissPinSetupPrompt: () => void

  resetData: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      tags: seedTags,
      familyMembers: seedFamilyMembers,
      expenses: seedExpenses,
      receipts: seedReceipts,
      receiptItems: seedReceiptItems,
      budget: seedBudget,
      watchlistItems: seedWatchlistItems,
      deals: seedDeals,
      shoppingList: seedShoppingList,
      settings: {
        useMembersAsTags: true,
        suggestMemberFromHistory: true,
        currency: 'USD',
        defaultReportView: 'monthly',
        incomeMemberIds: seedFamilyMembers.map((m) => m.id),
        notificationsEnabled: false,
        alertTypeAmount: true,
        alertTypePercentage: true,
      },

      // Initialize extended state
      incomeSources: seedIncomeSources,
      incomeItems: [],
      ongoingIncomes: [],
      userProfile: {
        name: 'Alex Johnson',
        email: 'dev@mjproductions.app',
        avatar: '🧑',
        preferences: {
          currency: 'USD',
          theme: 'auto',
          notifications: true,
          language: 'en',
        },
      },
      budgetGoals: [],
      recurringTransactions: [],
      spendingAlerts: [],
      familyInvites: [],
      appLock: {
        pinHash: null,
        pinSalt: null,
        pendingSetupPrompt: false,
      },

      // ── Existing methods ────────────────────────────────────────────

      addExpense: (input) => {
        const id = input.id ?? uid('exp')
        const expense: Expense = {
          id,
          amount: input.amount ?? 0,
          date: input.date ?? todayISO(),
          merchant: input.merchant ?? '',
          categoryId: input.categoryId ?? get().categories[0]?.id ?? '',
          tagIds: input.tagIds ?? [],
          memberId: input.memberId,
          notes: input.notes,
          receiptId: input.receiptId,
          source: input.source ?? 'manual',
        }
        set((s) => ({ expenses: [expense, ...s.expenses] }))
        return id
      },

      updateExpense: (id, patch) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      getExpensesBetween: (startDate, endDate) => {
        return get().expenses.filter((e) => e.date >= startDate && e.date <= endDate)
      },

      getExpensesByCategory: (categoryId) => {
        return get().expenses.filter((e) => e.categoryId === categoryId)
      },

      getExpensesByMember: (memberId) => {
        return get().expenses.filter((e) => e.memberId === memberId)
      },

      addReceipt: (merchant, date, total, imageUrl) => {
        const id = uid('rec')
        const receipt: Receipt = {
          id,
          merchant,
          date,
          total,
          imageUrl,
          itemIds: [],
          status: 'uploaded',
        }
        set((s) => ({ receipts: [receipt, ...s.receipts] }))
        return id
      },

      updateReceipt: (id, patch) =>
        set((s) => ({ receipts: s.receipts.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteReceipt: (id) =>
        set((s) => ({
          receipts: s.receipts.filter((r) => r.id !== id),
          receiptItems: s.receiptItems.filter((i) => i.receiptId !== id),
        })),

      analyzeReceipt: (receiptId) => {
        set((s) => ({
          receipts: s.receipts.map((r) => (r.id === receiptId ? { ...r, status: 'analyzing' as const } : r)),
        }))

        const { receipts } = get()
        const receipt = receipts.find((r) => r.id === receiptId)
        if (!receipt) return

        const { categories: allCategories, familyMembers } = get()
        const resolveCategoryId = (name: string) => {
          const match = allCategories.find((c) => c.name.toLowerCase() === name.toLowerCase())
          return match?.id ?? allCategories[0]?.id ?? ''
        }
        const defaultMember = familyMembers.find((m) => m.isDefault)?.id
        const items = mockExtractReceiptItems({
          receiptId,
          resolveCategoryId,
          defaultMemberId: defaultMember,
        })
        set((s) => ({
          receiptItems: [...items, ...s.receiptItems],
          receipts: s.receipts.map((r) =>
            r.id === receiptId
              ? { ...r, status: 'needs_review' as const, itemIds: items.map((i) => i.id) }
              : r,
          ),
        }))
      },

      confirmReceiptItems: (receiptId) => {
        const { receiptItems, receipts, expenses } = get()
        const receipt = receipts.find((r) => r.id === receiptId)
        if (!receipt) return
        const items = receiptItems.filter((i) => i.receiptId === receiptId)
        const existing = new Set(expenses.filter((e) => e.receiptId === receiptId).map((e) => e.id))
        const newExpenses: Expense[] = items
          .filter((i) => !existing.has(`exp_${i.id}`))
          .map((i) => ({
            id: `exp_${i.id}`,
            amount: i.amount,
            date: receipt.date,
            merchant: i.name,
            categoryId: i.categoryId,
            tagIds: i.tagIds,
            memberId: i.memberId,
            notes: `From ${receipt.merchant}`,
            receiptId,
            source: 'receipt_ai' as const,
          }))

        set((s) => ({
          expenses: [...newExpenses, ...s.expenses],
          receipts: s.receipts.map((r) => (r.id === receiptId ? { ...r, status: 'processed' as const } : r)),
        }))
      },

      updateReceiptItem: (id, patch) =>
        set((s) => ({
          receiptItems: s.receiptItems.map((i) =>
            i.id === id ? { ...i, ...patch, manuallyEdited: true } : i,
          ),
        })),

      removeReceiptItem: (id) =>
        set((s) => ({
          receiptItems: s.receiptItems.filter((i) => i.id !== id),
          expenses: s.expenses.filter((e) => e.id !== `exp_${id}`),
        })),

      addReceiptItem: (receiptId: string, item: Partial<Omit<ReceiptItem, 'id' | 'receiptId'>>) =>
        set((s) => {
          const newItem = {
            id: `item_${Date.now()}`,
            receiptId,
            name: '',
            amount: 0,
            categoryId: '',
            tagIds: [] as string[],
            aiConfidence: 0,
            ...item,
          } as ReceiptItem
          return { receiptItems: [...s.receiptItems, newItem] }
        }),

      addCategory: (name, icon, color) => {
        const id = uid('cat')
        const idx = get().categories.length
        const cat: Category = {
          id,
          name,
          icon: icon ?? CAT_ICONS[idx % CAT_ICONS.length],
          color: color ?? CAT_PALETTE[idx % CAT_PALETTE.length],
        }
        set((s) => ({ categories: [...s.categories, cat] }))
        return id
      },

      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addTag: (name, color) => {
        const id = uid('tag')
        const idx = get().tags.length
        const tag: Tag = { id, name, color: color ?? TAG_PALETTE[idx % TAG_PALETTE.length] }
        set((s) => ({ tags: [...s.tags, tag] }))
        return id
      },

      updateTag: (id, patch) =>
        set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTag: (id) => set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),

      addFamilyMember: (member) => {
        const id = uid('mem')
        const avatars = ['🧑', '👶', '🧓', '👵', '🧔']
        const idx = get().familyMembers.length
        const isAccountHolder = member.isAccountHolder ?? false
        const hasAppAccess = member.hasAppAccess ?? isAccountHolder
        const accessRole: MemberAccessRole =
          member.accessRole ?? (isAccountHolder ? 'admin' : hasAppAccess ? 'viewer' : 'viewer')
        const editorLevel = normalizeEditorLevel(accessRole, member.editorLevel)
        const m: FamilyMember = {
          id,
          name: member.name ?? 'New Member',
          relationship: member.relationship ?? 'Family',
          avatar: member.avatar ?? avatars[idx % avatars.length],
          active: member.active ?? true,
          isDefault: member.isDefault,
          isAccountHolder,
          hasAppAccess,
          accessRole: hasAppAccess || isAccountHolder ? accessRole : undefined,
          editorLevel: hasAppAccess || isAccountHolder ? editorLevel : undefined,
        }
        set((s) => ({
          familyMembers: [...s.familyMembers, m],
          settings: {
            ...s.settings,
            incomeMemberIds: s.settings.incomeMemberIds.includes(id)
              ? s.settings.incomeMemberIds
              : [...s.settings.incomeMemberIds, id],
          },
        }))
        return id
      },

      updateFamilyMember: (id, patch) =>
        set((s) => ({
          familyMembers: s.familyMembers.map((m) => {
            if (m.id !== id) return m
            if (m.isAccountHolder && patch.accessRole && patch.accessRole !== 'admin') return m
            const accessRole = patch.accessRole ?? m.accessRole
            const hasAppAccess = patch.hasAppAccess ?? m.hasAppAccess
            const editorLevel = normalizeEditorLevel(
              accessRole ?? 'viewer',
              patch.editorLevel ?? m.editorLevel,
            )
            return {
              ...m,
              ...patch,
              accessRole: hasAppAccess ? accessRole : undefined,
              editorLevel: hasAppAccess && accessRole === 'editor' ? editorLevel : undefined,
            }
          }),
        })),

      deleteFamilyMember: (id) =>
        set((s) => ({
          familyMembers: s.familyMembers.filter((m) => m.id !== id || m.isAccountHolder),
          settings: {
            ...s.settings,
            incomeMemberIds: s.settings.incomeMemberIds.filter((mid) => mid !== id),
          },
        })),

      addMemberToIncomePicker: (id) =>
        set((s) => {
          if (s.settings.incomeMemberIds.includes(id)) return s
          return {
            settings: {
              ...s.settings,
              incomeMemberIds: [...s.settings.incomeMemberIds, id],
            },
          }
        }),

      removeMembersFromIncomePicker: (ids) =>
        set((s) => ({
          settings: {
            ...s.settings,
            incomeMemberIds: s.settings.incomeMemberIds.filter((mid) => !ids.includes(mid)),
          },
        })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addWatchlistItem: (item) => {
        const id = uid('wl')
        const watchlistItem: WatchlistItem = {
          id,
          name: item.name ?? '',
          merchant: item.merchant ?? '',
          imageUrl: item.imageUrl,
          targetPrice: item.targetPrice,
          currentPrice: item.currentPrice,
          originalPrice: item.originalPrice,
          status: item.status ?? 'watching',
          lastCheckedAt: todayISO(),
        }
        set((s) => ({ watchlistItems: [...s.watchlistItems, watchlistItem] }))
      },

      removeWatchlistItem: (id) =>
        set((s) => ({ watchlistItems: s.watchlistItems.filter((w) => w.id !== id) })),

      runLocalDealCheck: () => {
        const now = todayISO()
        set((s) => ({
          watchlistItems: s.watchlistItems.map((w) => ({ ...w, lastCheckedAt: now })),
          deals: s.deals.map((d) => ({ ...d, foundAt: now })),
        }))
      },

      addDealToShoppingList: (dealId) => {
        const deal = get().deals.find((d) => d.id === dealId)
        if (!deal) return
        const exists = get().shoppingList.some((s) => s.dealId === dealId)
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, actionStatus: 'added_to_shopping_list' as const } : d,
          ),
          shoppingList: exists
            ? s.shoppingList
            : [
                {
                  id: uid('sl'),
                  dealId,
                  name: deal.name,
                  merchant: deal.merchant,
                  expectedPrice: deal.salePrice,
                  checked: false,
                  date: todayISO(),
                },
                ...s.shoppingList,
              ],
        }))
      },

      skipDeal: (dealId) =>
        set((s) => ({
          deals: s.deals.map((d) => (d.id === dealId ? { ...d, actionStatus: 'skipped' as const } : d)),
        })),

      keepWatchingDeal: (dealId) =>
        set((s) => ({
          deals: s.deals.map((d) => (d.id === dealId ? { ...d, actionStatus: 'keep_watching' as const } : d)),
        })),

      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),

      removeShoppingItem: (id) => set((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) })),

      addShoppingItem: (item: {
        name: string
        merchant?: string
        expectedPrice?: number
        categoryId?: string
      }) => {
        const id = `shop_${Date.now()}`
        const newItem: ShoppingListItem = {
          id,
          name: item.name,
          merchant: item.merchant ?? 'Any',
          expectedPrice: item.expectedPrice,
          checked: false,
          date: new Date().toISOString().split('T')[0],
        }
        set((s) => ({ shoppingList: [...s.shoppingList, newItem] }))
      },

      // ── New store methods ────────────────────────────────────────────

      addIncomeSource: (name, color) => {
        const id = uid('incsrc')
        const idx = get().incomeSources.length
        const source: IncomeSource = {
          id,
          name,
          color: color ?? TAG_PALETTE[idx % TAG_PALETTE.length],
        }
        set((s) => ({ incomeSources: [...s.incomeSources, source] }))
        return id
      },

      updateIncomeSource: (id, patch) =>
        set((s) => ({
          incomeSources: s.incomeSources.map((src) => (src.id === id ? { ...src, ...patch } : src)),
        })),

      deleteIncomeSource: (id) => {
        const fallback = get().incomeSources.find((s) => s.id !== id)
        set((s) => ({
          incomeSources: s.incomeSources.filter((src) => src.id !== id),
          incomeItems: fallback
            ? s.incomeItems.map((item) => (item.sourceId === id ? { ...item, sourceId: fallback.id } : item))
            : s.incomeItems,
        }))
      },

      addIncomeItem: (item) => {
        if (!item.memberId) return ''
        const id = item.id ?? uid('inc')
        const defaultSourceId = get().incomeSources[0]?.id ?? ''
        const incomeItem: IncomeItem = {
          id,
          date: item.date ?? todayISO(),
          sourceId: item.sourceId ?? defaultSourceId,
          amount: item.amount ?? 0,
          memberId: item.memberId,
          notes: item.notes,
        }
        set((s) => ({ incomeItems: [incomeItem, ...s.incomeItems] }))
        return id
      },

      updateIncomeItem: (id, patch) => {
        if ('memberId' in patch && !patch.memberId) return
        set((s) => ({
          incomeItems: s.incomeItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }))
      },

      deleteIncomeItem: (id) => set((s) => ({ incomeItems: s.incomeItems.filter((i) => i.id !== id) })),

      addOngoingIncome: (item) => {
        if (!item.memberId) return ''
        const id = item.id ?? uid('oinc')
        const entry: OngoingIncome = {
          id,
          sourceId: item.sourceId ?? get().incomeSources[0]?.id ?? '',
          amount: item.amount ?? 0,
          memberId: item.memberId,
          notes: item.notes,
          enabled: item.enabled ?? true,
        }
        set((s) => ({ ongoingIncomes: [...s.ongoingIncomes, entry] }))
        return id
      },

      updateOngoingIncome: (id, patch) => {
        if ('memberId' in patch && !patch.memberId) return
        set((s) => ({
          ongoingIncomes: s.ongoingIncomes.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        }))
      },

      deleteOngoingIncome: (id) =>
        set((s) => ({ ongoingIncomes: s.ongoingIncomes.filter((o) => o.id !== id) })),

      upsertOngoingIncome: ({ sourceId, amount, memberId, notes }) => {
        if (!memberId) return ''
        const existing = get().ongoingIncomes.find((o) => o.sourceId === sourceId && o.memberId === memberId)
        if (existing) {
          get().updateOngoingIncome(existing.id, { amount, notes, enabled: true })
          return existing.id
        }
        return get().addOngoingIncome({ sourceId, amount, memberId, notes, enabled: true })
      },

      getIncomeItems: (startDate, endDate) => {
        return get().incomeItems.filter((i) => i.date >= startDate && i.date <= endDate)
      },

      getTotalIncome: (startDate, endDate) => {
        const manual = get()
          .getIncomeItems(startDate, endDate)
          .reduce((sum, item) => sum + item.amount, 0)
        return manual + sumOngoingIncome(get().ongoingIncomes)
      },

      setUserProfile: (profile) => {
        set((s) => ({
          userProfile: {
            ...s.userProfile,
            ...profile,
            preferences: {
              ...s.userProfile.preferences,
              ...profile.preferences,
            },
          },
        }))
      },

      updateUserPreferences: (preferences) => {
        set((s) => ({
          userProfile: {
            ...s.userProfile,
            preferences: {
              ...s.userProfile.preferences,
              ...preferences,
            },
          },
        }))
      },

      updateBudget: (patch) => set((s) => ({ budget: { ...s.budget, ...patch } })),

      addBudgetGoal: (goal) => {
        const id = goal.id ?? uid('bg')
        const budgetGoal: BudgetGoal = {
          id,
          categoryId: goal.categoryId ?? '',
          targetAmount: goal.targetAmount ?? 0,
          period: goal.period ?? 'monthly',
        }
        set((s) => ({ budgetGoals: [...s.budgetGoals, budgetGoal] }))
        return id
      },

      updateBudgetGoal: (id, patch) =>
        set((s) => ({
          budgetGoals: s.budgetGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      deleteBudgetGoal: (id) => set((s) => ({ budgetGoals: s.budgetGoals.filter((g) => g.id !== id) })),

      addRecurringTransaction: (transaction) => {
        const id = transaction.id ?? uid('rt')
        const recurringTransaction: RecurringTransaction = {
          id,
          frequency: transaction.frequency ?? 'monthly',
          dayOfMonth: transaction.dayOfMonth,
          dayOfWeek: transaction.dayOfWeek,
          monthOfYear: transaction.monthOfYear,
          expense: transaction.expense ?? {},
        }
        set((s) => ({ recurringTransactions: [...s.recurringTransactions, recurringTransaction] }))
        return id
      },

      updateRecurringTransaction: (id, patch) =>
        set((s) => ({
          recurringTransactions: s.recurringTransactions.map((rt) =>
            rt.id === id ? { ...rt, ...patch } : rt,
          ),
        })),

      deleteRecurringTransaction: (id) =>
        set((s) => ({
          recurringTransactions: s.recurringTransactions.filter((rt) => rt.id !== id),
        })),

      addSpendingAlert: (alert) => {
        const id = alert.id ?? uid('sa')
        const spendingAlert: SpendingAlert = {
          id,
          categoryId: alert.categoryId ?? '',
          threshold: alert.threshold ?? 0,
          alertType: alert.alertType ?? 'amount',
        }
        set((s) => ({ spendingAlerts: [...s.spendingAlerts, spendingAlert] }))
        return id
      },

      updateSpendingAlert: (id, patch) =>
        set((s) => ({
          spendingAlerts: s.spendingAlerts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteSpendingAlert: (id) =>
        set((s) => ({ spendingAlerts: s.spendingAlerts.filter((a) => a.id !== id) })),

      getSpendingAlertsByCategory: (categoryId) => {
        return get().spendingAlerts.filter((a) => a.categoryId === categoryId)
      },

      getAllSpendingAlerts: () => {
        return get().spendingAlerts
      },

      createFamilyInvite: (accessRole = 'editor', editorLevel = defaultEditorLevel()) => {
        const id = uid('fi')
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const invite: FamilyInvite = {
          id,
          code,
          createdAt: todayISO(),
          accessRole,
          editorLevel: accessRole === 'editor' ? editorLevel : undefined,
        }
        set((s) => ({ familyInvites: [...s.familyInvites, invite] }))
        return code
      },

      useFamilyInvite: (code, usedBy) => {
        const normalized = normalizeInviteCode(code)
        const invite = get().familyInvites.find(
          (fi) => normalizeInviteCode(fi.code) === normalized && !fi.usedAt,
        )
        if (!invite) return false
        set((s) => ({
          familyInvites: s.familyInvites.map((fi) =>
            fi.id === invite.id ? { ...fi, usedAt: todayISO(), usedBy } : fi,
          ),
        }))
        return true
      },

      findFamilyInvite: (code) => {
        const normalized = normalizeInviteCode(code)
        return get().familyInvites.find((fi) => normalizeInviteCode(fi.code) === normalized)
      },

      getFamilyInvites: () => {
        return get().familyInvites
      },

      getUnusedInvites: () => {
        return get().familyInvites.filter((fi) => !fi.usedAt)
      },

      revokeFamilyInvite: (id) => {
        set((s) => ({ familyInvites: s.familyInvites.filter((fi) => fi.id !== id) }))
      },

      sendFamilyInvite: (code, contact) => {
        const trimmed = contact.trim()
        const normalized = trimmed.includes('@') ? trimmed.toLowerCase() : trimmed
        set((s) => ({
          familyInvites: s.familyInvites.map((fi) =>
            fi.code === code ? { ...fi, sentToContact: normalized, sentAt: todayISO() } : fi,
          ),
        }))
      },

      updateFamilyInvite: (code, patch) => {
        const normalized = normalizeInviteCode(code)
        set((s) => ({
          familyInvites: s.familyInvites.map((fi) => {
            if (normalizeInviteCode(fi.code) !== normalized || fi.usedAt) return fi
            const accessRole = patch.accessRole ?? fi.accessRole
            return {
              ...fi,
              ...patch,
              accessRole,
              editorLevel:
                accessRole === 'editor'
                  ? normalizeEditorLevel(accessRole, patch.editorLevel ?? fi.editorLevel)
                  : undefined,
            }
          }),
        }))
      },

      setAppPin: async (pin) => {
        const salt = generateSalt()
        const pinHash = await hashPin(pin, salt)
        set((s) => ({
          appLock: {
            ...s.appLock,
            pinHash,
            pinSalt: salt,
            pendingSetupPrompt: false,
          },
        }))
      },

      changeAppPin: async (currentPin, newPin) => {
        const { pinHash, pinSalt } = get().appLock
        if (!pinHash || !pinSalt) {
          return { ok: false, error: 'No PIN is set yet' }
        }
        const valid = await verifyPin(currentPin, pinSalt, pinHash)
        if (!valid) return { ok: false, error: 'Incorrect current PIN' }
        const salt = generateSalt()
        const nextHash = await hashPin(newPin, salt)
        set((s) => ({
          appLock: { ...s.appLock, pinHash: nextHash, pinSalt: salt },
        }))
        return { ok: true }
      },

      clearAppPin: () =>
        set((s) => ({
          appLock: { ...s.appLock, pinHash: null, pinSalt: null },
        })),

      verifyAppPin: async (pin) => {
        const { pinHash, pinSalt } = get().appLock
        if (!pinHash || !pinSalt) return true
        return verifyPin(pin, pinSalt, pinHash)
      },

      triggerPinSetupPrompt: () =>
        set((s) => ({
          appLock: { ...s.appLock, pendingSetupPrompt: true },
        })),

      dismissPinSetupPrompt: () =>
        set((s) => ({
          appLock: { ...s.appLock, pendingSetupPrompt: false },
        })),

      resetData: () =>
        set({
          categories: seedCategories,
          tags: seedTags,
          familyMembers: seedFamilyMembers,
          expenses: seedExpenses,
          receipts: seedReceipts,
          receiptItems: seedReceiptItems,
          budget: seedBudget,
          watchlistItems: seedWatchlistItems,
          deals: seedDeals,
          shoppingList: seedShoppingList,
          incomeSources: seedIncomeSources,
          incomeItems: [],
          ongoingIncomes: [],
          budgetGoals: [],
          recurringTransactions: [],
          spendingAlerts: [],
          familyInvites: [],
          appLock: {
            pinHash: null,
            pinSalt: null,
            pendingSetupPrompt: false,
          },
        }),
    }),
    {
      name: 'budgii',
      version: 13,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          state.appLock = {
            pinHash: null,
            pinSalt: null,
            pendingSetupPrompt: false,
          }
        }
        if (version < 3) {
          const legacySources: IncomeSource[] = [
            { id: 'incsrc_salary', name: 'Salary', color: '#2386F6' },
            { id: 'incsrc_freelance', name: 'Freelance', color: '#16A34A' },
            { id: 'incsrc_investment', name: 'Investment', color: '#9B5DE5' },
            { id: 'incsrc_other', name: 'Other', color: '#F59E0B' },
          ]
          const legacyMap: Record<string, string> = {
            Salary: 'incsrc_salary',
            Freelance: 'incsrc_freelance',
            Investment: 'incsrc_investment',
            Other: 'incsrc_other',
          }
          if (!state.incomeSources) state.incomeSources = legacySources
          const items = state.incomeItems as Array<Record<string, unknown>> | undefined
          if (items) {
            state.incomeItems = items.map((item) => {
              const { source, ...rest } = item
              const sourceId =
                (rest.sourceId as string | undefined) ?? legacyMap[String(source)] ?? 'incsrc_other'
              return { ...rest, sourceId }
            })
          }
        }
        if (version < 4) {
          const settings = state.settings as Record<string, unknown> | undefined
          const members = state.familyMembers as FamilyMember[] | undefined
          if (settings && !settings.incomeMemberIds && members) {
            settings.incomeMemberIds = members.map((m) => m.id)
          }
        }
        if (version < 5) {
          state.incomeItems = []
        }
        if (version < 6) {
          const receiptItems = state.receiptItems as ReceiptItem[] | undefined
          if (receiptItems) {
            const brokenIds = new Set(
              receiptItems.filter((i) => i.name === 'New Item' && i.amount === 0).map((i) => i.id),
            )
            if (brokenIds.size > 0) {
              state.receiptItems = receiptItems.filter((i) => !brokenIds.has(i.id))
              const receipts = state.receipts as Receipt[] | undefined
              if (receipts) {
                state.receipts = receipts.map((r) => ({
                  ...r,
                  itemIds: r.itemIds.filter((id) => !brokenIds.has(id)),
                }))
              }
            }
          }
        }
        if (version < 7) {
          state.ongoingIncomes = []
        }
        if (version < 8) {
          state.incomeItems = []
          state.ongoingIncomes = []
        }
        if (version < 9) {
          state.incomeItems = []
          state.ongoingIncomes = []
        }
        if (version < 10) {
          state.incomeItems = []
          state.ongoingIncomes = []
        }
        if (version < 11) {
          state.incomeItems = []
          state.ongoingIncomes = []
        }
        if (version < 12) {
          const settings = state.settings as Record<string, unknown> | undefined
          if (settings) {
            settings.notificationsEnabled = settings.notificationsEnabled ?? false
            settings.alertTypeAmount = settings.alertTypeAmount ?? true
            settings.alertTypePercentage = settings.alertTypePercentage ?? true
          }
        }
        if (version < 13) {
          const members = state.familyMembers as FamilyMember[] | undefined
          if (members) {
            state.familyMembers = members.map((m) => {
              const isAccountHolder = m.isAccountHolder ?? m.isDefault ?? m.relationship === 'You'
              const hasAppAccess = m.hasAppAccess ?? isAccountHolder
              const accessRole: MemberAccessRole =
                m.accessRole ?? (isAccountHolder ? 'admin' : hasAppAccess ? 'viewer' : 'viewer')
              return {
                ...m,
                isAccountHolder,
                hasAppAccess,
                accessRole: hasAppAccess ? accessRole : undefined,
                editorLevel:
                  hasAppAccess && accessRole === 'editor'
                    ? normalizeEditorLevel(accessRole, m.editorLevel)
                    : undefined,
              }
            })
          }
          const invites = state.familyInvites as FamilyInvite[] | undefined
          if (invites) {
            state.familyInvites = invites.map((invite) => ({
              ...invite,
              accessRole: invite.accessRole ?? 'editor',
              editorLevel:
                (invite.accessRole ?? 'editor') === 'editor'
                  ? (invite.editorLevel ?? defaultEditorLevel())
                  : undefined,
            }))
          }
        }
        return state as AppStore
      },
      onRehydrateStorage: () => (state, err) => {
        if (err || typeof window === 'undefined') return
        if (localStorage.getItem('budgii-income-cleared-v11')) return
        queueMicrotask(() => {
          useStore.setState({ incomeItems: [], ongoingIncomes: [] })
          localStorage.setItem('budgii-income-cleared-v11', '1')
        })
      },
    },
  ),
)
