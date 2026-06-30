import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Budget,
  Category,
  Deal,
  Expense,
  FamilyMember,
  Receipt,
  ReceiptItem,
  ShoppingListItem,
  Tag,
  WatchlistItem,
} from '@/types'
import {
  seedBudget,
  seedCategories,
  seedDeals,
  seedExpenses,
  seedFamilyMembers,
  seedReceiptItems,
  seedReceipts,
  seedShoppingList,
  seedTags,
  seedWatchlistItems,
} from '@/data/seed'
import { uid } from '@/utils/id'
import { todayISO } from '@/utils/dates'
import {
  MOCK_RECEIPT_MERCHANT,
  MOCK_RECEIPT_OCR,
  MOCK_RECEIPT_TOTAL,
  mockExtractReceiptItems,
} from '@/utils/mockAi'

const TAG_PALETTE = ['#FB8500', '#16A34A', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']
const CAT_PALETTE = ['#16A34A', '#FB8500', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']
const CAT_ICONS = ['🛒', '🍽️', '🚗', '🛍️', '📄', '❤️', '⭐', '🎁', '✈️', '🏠']

// ── New types for extended store ────────────────────────────────────────

export type IncomeItem = {
  id: string
  date: string
  source: 'Salary' | 'Freelance' | 'Investment' | 'Other'
  amount: number
  notes?: string
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
  }

  // Extended store state
  incomeItems: IncomeItem[]
  userProfile: UserProfile
  budgetGoals: BudgetGoal[]
  recurringTransactions: RecurringTransaction[]
  spendingAlerts: SpendingAlert[]
  familyInvites: FamilyInvite[]

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
  addReceiptItem: (receiptId: string, item: Partial<Omit<ReceiptItem, 'id' | 'receiptId' | 'aiConfidence'>>) => void
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

  // Watchlist & Deals
  addWatchlistItem: (item: Partial<WatchlistItem>) => void
  removeWatchlistItem: (id: string) => void
  mockRunDailyDealCheck: () => void
  addDealToShoppingList: (dealId: string) => void
  skipDeal: (dealId: string) => void
  keepWatchingDeal: (dealId: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  addShoppingItem: (item: { name: string; merchant?: string; expectedPrice?: number; categoryId?: string }) => void

  // ── New store methods ────────────────────────────────────────────────

  // Income Items
  addIncomeItem: (item: Partial<IncomeItem>) => string
  updateIncomeItem: (id: string, patch: Partial<IncomeItem>) => void
  deleteIncomeItem: (id: string) => void
  getIncomeItems: (startDate: string, endDate: string) => IncomeItem[]
  getTotalIncome: (startDate: string, endDate: string) => number

  // User Profile
  setUserProfile: (profile: Partial<UserProfile>) => void
  getUserProfile: () => UserProfile
  updateUserPreferences: (preferences: Partial<UserProfile['preferences']>) => void

  // Budget
  updateBudget: (patch: Partial<Budget>) => void

  // Budget Goals
  addBudgetGoal: (goal: Partial<BudgetGoal>) => string
  updateBudgetGoal: (id: string, patch: Partial<BudgetGoal>) => void
  deleteBudgetGoal: (id: string) => void
  getBudgetGoalsByCategory: (categoryId: string) => BudgetGoal[]
  getAllBudgetGoals: () => BudgetGoal[]

  // Recurring Transactions
  addRecurringTransaction: (transaction: Partial<RecurringTransaction>) => string
  updateRecurringTransaction: (id: string, patch: Partial<RecurringTransaction>) => void
  deleteRecurringTransaction: (id: string) => void
  getRecurringTransactions: () => RecurringTransaction[]
  applyRecurringTransaction: (id: string) => void

  // Spending Alerts
  addSpendingAlert: (alert: Partial<SpendingAlert>) => string
  updateSpendingAlert: (id: string, patch: Partial<SpendingAlert>) => void
  deleteSpendingAlert: (id: string) => void
  getSpendingAlertsByCategory: (categoryId: string) => SpendingAlert[]
  getAllSpendingAlerts: () => SpendingAlert[]

  // Family Invites
  createFamilyInvite: () => string
  useFamilyInvite: (code: string, usedBy: string) => boolean
  getFamilyInvites: () => FamilyInvite[]
  getUnusedInvites: () => FamilyInvite[]

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
      },

      // Initialize extended state
      incomeItems: [],
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
          receipts: s.receipts.map((r) =>
            r.id === receiptId ? { ...r, status: 'analyzing' as const } : r,
          ),
        }))

        const { receipts } = get()
        const receipt = receipts.find((r) => r.id === receiptId)
        if (!receipt) return

        const { categories: allCategories, familyMembers } = get()
        const resolveCategoryId = (name: string) =>
          allCategories[0]?.id ?? ''
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
            merchant: receipt.merchant,
            categoryId: i.categoryId,
            tagIds: i.tagIds,
            memberId: i.memberId,
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

      addReceiptItem: (receiptId: string, item: Partial<Omit<ReceiptItem, 'id' | 'receiptId' | 'aiConfidence'>>) =>
        set((s) => ({
          receiptItems: [
            ...s.receiptItems,
            {
              id: `item_${Date.now()}`,
              receiptId,
              ...item,
              aiConfidence: 0,
            } as ReceiptItem,
          ],
        })),

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

      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

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
        const m: FamilyMember = {
          id,
          name: member.name ?? 'New Member',
          relationship: member.relationship ?? 'Family',
          avatar: member.avatar ?? avatars[idx % avatars.length],
          active: member.active ?? true,
          isDefault: member.isDefault,
        }
        set((s) => ({ familyMembers: [...s.familyMembers, m] }))
        return id
      },

      updateFamilyMember: (id, patch) =>
        set((s) => ({
          familyMembers: s.familyMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      deleteFamilyMember: (id) =>
        set((s) => ({
          familyMembers: s.familyMembers.filter((m) => m.id !== id),
        })),

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

      mockRunDailyDealCheck: () => {
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
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, actionStatus: 'skipped' as const } : d,
          ),
        })),

      keepWatchingDeal: (dealId) =>
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, actionStatus: 'keep_watching' as const } : d,
          ),
        })),

      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingList: s.shoppingList.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        })),

      removeShoppingItem: (id) =>
        set((s) => ({ shoppingList: s.shoppingList.filter((i) => i.id !== id) })),

      addShoppingItem: (item: { name: string; merchant?: string; expectedPrice?: number; categoryId?: string }) => {
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

      addIncomeItem: (item) => {
        const id = item.id ?? uid('inc')
        const incomeItem: IncomeItem = {
          id,
          date: item.date ?? todayISO(),
          source: (item.source as IncomeItem['source']) ?? 'Other',
          amount: item.amount ?? 0,
          notes: item.notes,
        }
        set((s) => ({ incomeItems: [incomeItem, ...s.incomeItems] }))
        return id
      },

      updateIncomeItem: (id, patch) =>
        set((s) => ({
          incomeItems: s.incomeItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      deleteIncomeItem: (id) =>
        set((s) => ({ incomeItems: s.incomeItems.filter((i) => i.id !== id) })),

      getIncomeItems: (startDate, endDate) => {
        return get().incomeItems.filter((i) => i.date >= startDate && i.date <= endDate)
      },

      getTotalIncome: (startDate, endDate) => {
        return get()
          .getIncomeItems(startDate, endDate)
          .reduce((sum, item) => sum + item.amount, 0)
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

      getUserProfile: () => {
        return get().userProfile
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

      updateBudget: (patch) =>
        set((s) => ({ budget: { ...s.budget, ...patch } })),

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

      deleteBudgetGoal: (id) =>
        set((s) => ({ budgetGoals: s.budgetGoals.filter((g) => g.id !== id) })),

      getBudgetGoalsByCategory: (categoryId) => {
        return get().budgetGoals.filter((g) => g.categoryId === categoryId)
      },

      getAllBudgetGoals: () => {
        return get().budgetGoals
      },

      addRecurringTransaction: (transaction) => {
        const id = transaction.id ?? uid('rt')
        const recurringTransaction: RecurringTransaction = {
          id,
          frequency: transaction.frequency ?? 'monthly',
          dayOfMonth: transaction.dayOfMonth,
          dayOfWeek: transaction.dayOfWeek,
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

      getRecurringTransactions: () => {
        return get().recurringTransactions
      },

      applyRecurringTransaction: (id) => {
        const transaction = get().recurringTransactions.find((rt) => rt.id === id)
        if (!transaction) return
        const expenseData = {
          amount: transaction.expense.amount ?? 0,
          merchant: transaction.expense.merchant ?? '',
          categoryId: transaction.expense.categoryId ?? '',
          ...transaction.expense,
        }
        get().addExpense(expenseData)
      },

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

      createFamilyInvite: () => {
        const id = uid('fi')
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const invite: FamilyInvite = {
          id,
          code,
          createdAt: todayISO(),
        }
        set((s) => ({ familyInvites: [...s.familyInvites, invite] }))
        return code
      },

      useFamilyInvite: (code, usedBy) => {
        const invite = get().familyInvites.find((fi) => fi.code === code && !fi.usedAt)
        if (!invite) return false
        set((s) => ({
          familyInvites: s.familyInvites.map((fi) =>
            fi.id === invite.id ? { ...fi, usedAt: todayISO(), usedBy } : fi,
          ),
        }))
        return true
      },

      getFamilyInvites: () => {
        return get().familyInvites
      },

      getUnusedInvites: () => {
        return get().familyInvites.filter((fi) => !fi.usedAt)
      },

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
          incomeItems: [],
          budgetGoals: [],
          recurringTransactions: [],
          spendingAlerts: [],
          familyInvites: [],
        }),
    }),
    {
      name: 'budgii',
      version: 1,
    },
  ),
)

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
