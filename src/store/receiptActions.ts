import type { AppStore } from './appStore'
import type { Expense, Receipt, ReceiptItem } from '@/types'
import { mockExtractReceiptItems } from '@/utils/mockAi'
import { uid } from '@/utils/id'

type SetState = (updater: (state: AppStore) => Partial<AppStore>) => void
type GetState = () => AppStore

export function createReceiptActions(
  set: SetState,
  get: GetState,
): Pick<
  AppStore,
  | 'addReceipt'
  | 'updateReceipt'
  | 'deleteReceipt'
  | 'analyzeReceipt'
  | 'confirmReceiptItems'
  | 'addReceiptItem'
  | 'updateReceiptItem'
  | 'removeReceiptItem'
> {
  return {
    addReceipt: (merchant, date, total, imageUrl) => {
      const id = uid('rec')
      const receipt: Receipt = { id, merchant, date, total, imageUrl, itemIds: [], status: 'uploaded' }
      set((s) => ({ receipts: [receipt, ...s.receipts] }))
      return id
    },

    updateReceipt: (id, patch) =>
      set((s) => ({
        receipts: s.receipts.map((receipt) => (receipt.id === id ? { ...receipt, ...patch } : receipt)),
      })),

    deleteReceipt: (id) =>
      set((s) => ({
        receipts: s.receipts.filter((receipt) => receipt.id !== id),
        receiptItems: s.receiptItems.filter((item) => item.receiptId !== id),
      })),

    analyzeReceipt: (receiptId) => {
      set((s) => ({
        receipts: s.receipts.map((receipt) =>
          receipt.id === receiptId ? { ...receipt, status: 'analyzing' as const } : receipt,
        ),
      }))

      const receipt = get().receipts.find((item) => item.id === receiptId)
      if (!receipt) return

      const { categories, familyMembers } = get()
      const resolveCategoryId = (name: string) =>
        categories.find((category) => category.name.toLowerCase() === name.toLowerCase())?.id ??
        categories[0]?.id ??
        ''
      const defaultMemberId = familyMembers.find((member) => member.isDefault)?.id
      const items = mockExtractReceiptItems({ receiptId, resolveCategoryId, defaultMemberId })
      set((s) => ({
        receiptItems: [...items, ...s.receiptItems],
        receipts: s.receipts.map((item) =>
          item.id === receiptId
            ? { ...item, status: 'needs_review' as const, itemIds: items.map((i) => i.id) }
            : item,
        ),
      }))
    },

    confirmReceiptItems: (receiptId) => {
      const { receiptItems, receipts, expenses } = get()
      const receipt = receipts.find((item) => item.id === receiptId)
      if (!receipt) return
      const items = receiptItems.filter((item) => item.receiptId === receiptId)
      const existing = new Set(
        expenses.filter((expense) => expense.receiptId === receiptId).map((expense) => expense.id),
      )
      const newExpenses: Expense[] = items
        .filter((item) => !existing.has(`exp_${item.id}`))
        .map((item) => ({
          id: `exp_${item.id}`,
          amount: item.amount,
          date: receipt.date,
          merchant: item.name,
          categoryId: item.categoryId,
          tagIds: item.tagIds,
          memberId: item.memberId,
          notes: `From ${receipt.merchant}`,
          receiptId,
          source: 'receipt_ai' as const,
        }))

      set((s) => ({
        expenses: [...newExpenses, ...s.expenses],
        receipts: s.receipts.map((item) =>
          item.id === receiptId ? { ...item, status: 'processed' as const } : item,
        ),
      }))
    },

    updateReceiptItem: (id, patch) =>
      set((s) => ({
        receiptItems: s.receiptItems.map((item) =>
          item.id === id ? { ...item, ...patch, manuallyEdited: true } : item,
        ),
      })),

    removeReceiptItem: (id) =>
      set((s) => ({
        receiptItems: s.receiptItems.filter((item) => item.id !== id),
        expenses: s.expenses.filter((expense) => expense.id !== `exp_${id}`),
      })),

    addReceiptItem: (receiptId, item) =>
      set((s) => ({
        receiptItems: [
          ...s.receiptItems,
          {
            id: `item_${Date.now()}`,
            receiptId,
            name: '',
            amount: 0,
            categoryId: '',
            tagIds: [] as string[],
            aiConfidence: 0,
            ...item,
          } as ReceiptItem,
        ],
      })),
  }
}
