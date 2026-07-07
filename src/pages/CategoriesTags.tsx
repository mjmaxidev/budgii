import { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { ColorPickerField } from '@/components/ui/ColorPickerField'
import { CATEGORY_COLOR_CHOICES } from '@/constants/categoryChoices'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { updateExpense as apiUpdateExpense } from '@/api/expenses'
import { updateReceiptItem as apiUpdateReceiptItem } from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'

const EMOJI = ['🛒', '🍽️', '🚗', '🛍️', '📄', '❤️', '⭐', '🎁', '✈️', '🏠', '🐶', '💊']

export function CategoriesTags() {
  const categories = useStore((s) => s.categories)
  const tags = useStore((s) => s.tags)
  const expenses = useStore((s) => s.expenses)
  const receiptItems = useStore((s) => s.receiptItems)
  const budget = useStore((s) => s.budget)
  const budgetGoals = useStore((s) => s.budgetGoals)
  const recurringTransactions = useStore((s) => s.recurringTransactions)
  const spendingAlerts = useStore((s) => s.spendingAlerts)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const addTag = useStore((s) => s.addTag)
  const deleteTag = useStore((s) => s.deleteTag)
  const updateExpense = useStore((s) => s.updateExpense)
  const updateReceiptItem = useStore((s) => s.updateReceiptItem)
  const updateBudget = useStore((s) => s.updateBudget)
  const updateBudgetGoal = useStore((s) => s.updateBudgetGoal)
  const updateRecurringTransaction = useStore((s) => s.updateRecurringTransaction)
  const updateSpendingAlert = useStore((s) => s.updateSpendingAlert)
  const householdId = useAuthStore((s) => s.householdId)
  const apiOn = isApiEnabled()

  const [editCats, setEditCats] = useState(false)
  const [editTags, setEditTags] = useState(false)
  const [catModal, setCatModal] = useState<{ open: boolean; id?: string }>({ open: false })
  const [tagModal, setTagModal] = useState(false)
  const [categoryDelete, setCategoryDelete] = useState<{ id: string; replacementId: string } | null>(null)
  const [tagDelete, setTagDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJI[0])
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0])
  const [tagName, setTagName] = useState('')

  function categoryUsage(id: string) {
    return {
      expenses: expenses.filter((expense) => expense.categoryId === id),
      receiptItems: receiptItems.filter((item) => item.categoryId === id),
      budgetGoals: budgetGoals.filter((goal) => goal.categoryId === id),
      recurringTransactions: recurringTransactions.filter((transaction) => transaction.expense.categoryId === id),
      spendingAlerts: spendingAlerts.filter((alert) => alert.categoryId === id),
      hasAllocation: budget.categoryAllocations[id] !== undefined,
    }
  }

  function tagUsage(id: string) {
    return {
      expenses: expenses.filter((expense) => expense.tagIds.includes(id)),
      receiptItems: receiptItems.filter((item) => item.tagIds.includes(id)),
      recurringTransactions: recurringTransactions.filter((transaction) => transaction.expense.tagIds?.includes(id)),
    }
  }

  function apiMessage(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback
  }

  function openNewCat() {
    setName('')
    setEmoji(EMOJI[0])
    setColor(CATEGORY_COLOR_CHOICES[0])
    setCatModal({ open: true })
  }
  function openEditCat(id: string) {
    const c = categories.find((x) => x.id === id)!
    setName(c.name)
    setEmoji(c.icon)
    setColor(c.color)
    setCatModal({ open: true, id })
  }
  function saveCat() {
    if (!name.trim()) return
    if (catModal.id) updateCategory(catModal.id, { name: name.trim(), icon: emoji, color })
    else addCategory(name.trim(), emoji, color)
    setCatModal({ open: false })
  }
  function saveTag() {
    if (!tagName.trim()) return
    addTag(tagName.trim())
    setTagName('')
    setTagModal(false)
  }

  function requestCategoryDelete(id: string) {
    setDeleteError('')
    const usage = categoryUsage(id)
    const inUse =
      usage.expenses.length > 0 ||
      usage.receiptItems.length > 0 ||
      usage.budgetGoals.length > 0 ||
      usage.recurringTransactions.length > 0 ||
      usage.spendingAlerts.length > 0 ||
      usage.hasAllocation

    if (!inUse) {
      deleteCategory(id)
      return
    }

    const replacement = categories.find((category) => category.id !== id)
    if (!replacement) {
      setDeleteError('Add another category before deleting this one.')
      return
    }

    setCategoryDelete({ id, replacementId: replacement.id })
  }

  async function confirmCategoryDelete() {
    if (!categoryDelete || deleting) return
    const { id, replacementId } = categoryDelete
    const usage = categoryUsage(id)

    setDeleting(true)
    setDeleteError('')

    try {
      if (apiOn) {
        if (!householdId) throw new Error('No household selected.')
        await Promise.all([
          ...usage.expenses.map((expense) => apiUpdateExpense(householdId, expense.id, { categoryId: replacementId })),
          ...usage.receiptItems.map((item) =>
            apiUpdateReceiptItem(householdId, item.receiptId, item.id, { categoryId: replacementId }),
          ),
        ])
      }

      usage.expenses.forEach((expense) => updateExpense(expense.id, { categoryId: replacementId }))
      usage.receiptItems.forEach((item) => updateReceiptItem(item.id, { categoryId: replacementId }))

      const nextAllocations = { ...budget.categoryAllocations }
      const deletedAllocation = nextAllocations[id]
      if (deletedAllocation !== undefined) {
        nextAllocations[replacementId] = (nextAllocations[replacementId] ?? 0) + deletedAllocation
        delete nextAllocations[id]
        updateBudget({ categoryAllocations: nextAllocations })
      }

      usage.budgetGoals.forEach((goal) => updateBudgetGoal(goal.id, { categoryId: replacementId }))
      usage.recurringTransactions.forEach((transaction) =>
        updateRecurringTransaction(transaction.id, {
          expense: { ...transaction.expense, categoryId: replacementId },
        }),
      )
      usage.spendingAlerts.forEach((alert) => updateSpendingAlert(alert.id, { categoryId: replacementId }))
      deleteCategory(id)
      setCategoryDelete(null)
    } catch (err) {
      setDeleteError(apiMessage(err, 'Could not reassign this category.'))
    } finally {
      setDeleting(false)
    }
  }

  function requestTagDelete(id: string) {
    setDeleteError('')
    const usage = tagUsage(id)
    if (usage.expenses.length === 0 && usage.receiptItems.length === 0 && usage.recurringTransactions.length === 0) {
      deleteTag(id)
      return
    }
    setTagDelete(id)
  }

  async function confirmTagDelete() {
    if (!tagDelete || deleting) return
    const id = tagDelete
    const usage = tagUsage(id)

    setDeleting(true)
    setDeleteError('')

    try {
      if (apiOn) {
        if (!householdId) throw new Error('No household selected.')
        await Promise.all([
          ...usage.expenses.map((expense) =>
            apiUpdateExpense(householdId, expense.id, { tagIds: expense.tagIds.filter((tagId) => tagId !== id) }),
          ),
          ...usage.receiptItems.map((item) =>
            apiUpdateReceiptItem(householdId, item.receiptId, item.id, {
              tagIds: item.tagIds.filter((tagId) => tagId !== id),
            }),
          ),
        ])
      }

      usage.expenses.forEach((expense) =>
        updateExpense(expense.id, { tagIds: expense.tagIds.filter((tagId) => tagId !== id) }),
      )
      usage.receiptItems.forEach((item) =>
        updateReceiptItem(item.id, { tagIds: item.tagIds.filter((tagId) => tagId !== id) }),
      )
      usage.recurringTransactions.forEach((transaction) =>
        updateRecurringTransaction(transaction.id, {
          expense: {
            ...transaction.expense,
            tagIds: transaction.expense.tagIds?.filter((tagId) => tagId !== id),
          },
        }),
      )
      deleteTag(id)
      setTagDelete(null)
    } catch (err) {
      setDeleteError(apiMessage(err, 'Could not remove this tag.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell topBar={<TopBar title="Categories & Tags" showBack />}>
      {/* Categories */}
      {deleteError && (
        <div className="mb-3 rounded-card border border-red/20 bg-red/5 px-3 py-2 text-[13px] font-semibold text-red">
          {deleteError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-ink">Categories</h2>
        <button onClick={() => setEditCats((v) => !v)} className="text-[15px] font-bold text-primary">
          {editCats ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => openEditCat(c.id)}
            className="relative flex flex-col items-center gap-2 rounded-card border border-line/60 bg-surface py-5 shadow-card active:bg-surfaceSoft"
          >
            <CategoryIcon icon={c.icon} color={c.color} size={48} className="rounded-2xl text-2xl" />
            <span className="truncate w-full px-1 text-center text-[14px] font-semibold text-ink">{c.name}</span>
            {editCats && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  requestCategoryDelete(c.id)
                }}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red text-white"
              >
                <Trash2 size={13} />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={openNewCat}
          className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary/40 py-5 text-primary active:bg-primarySoft"
        >
          <Plus size={26} />
          <span className="text-[14px] font-bold">Add Category</span>
        </button>
      </div>

      {/* Tags */}
      <div className="mt-8 flex items-center justify-between border-t border-line/70 pt-6">
        <h2 className="text-[18px] font-extrabold text-ink">Tags</h2>
        <button onClick={() => setEditTags((v) => !v)} className="text-[15px] font-bold text-primary">
          {editTags ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {tags.map((t) => (
          <span key={t.id} className="relative">
            <Chip color={t.color}>{t.name}</Chip>
            {editTags && (
              <button
                onClick={() => requestTagDelete(t.id)}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red text-white"
              >
                <Trash2 size={11} />
              </button>
            )}
          </span>
        ))}
        <button
          onClick={() => setTagModal(true)}
          className="inline-flex items-center gap-1 rounded-pill border-2 border-dashed border-line px-3.5 py-1.5 text-[13px] font-bold text-muted active:bg-surfaceSoft"
        >
          <Plus size={14} /> Add Tag
        </button>
      </div>

      {/* Category modal */}
      <Modal open={catModal.open} onClose={() => setCatModal({ open: false })} title={catModal.id ? 'Edit Category' : 'New Category'}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <p className="mb-2 mt-4 text-[13px] font-semibold text-muted">Icon</p>
        <div className="grid grid-cols-6 gap-2">
          {EMOJI.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-11 items-center justify-center rounded-xl border text-xl ${
                emoji === e ? 'border-primary bg-primarySoft' : 'border-line'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <ColorPickerField value={color} onChange={setColor} presets={CATEGORY_COLOR_CHOICES} label="Colour" />
        </div>
        <div className="mt-5 flex gap-3">
          {catModal.id && (
            <button
              onClick={() => {
                requestCategoryDelete(catModal.id!)
                setCatModal({ open: false })
              }}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-red/40 px-5 text-[15px] font-bold text-red"
            >
              <Trash2 size={18} />
            </button>
          )}
          <ActionButton onClick={saveCat} leftIcon={<Check size={18} />}>
            Save
          </ActionButton>
        </div>
      </Modal>

      {/* Tag modal */}
      <Modal open={tagModal} onClose={() => setTagModal(false)} title="New Tag">
        <input
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="Tag name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <ActionButton className="mt-4" onClick={saveTag}>
          Add Tag
        </ActionButton>
      </Modal>

      <Modal open={categoryDelete !== null} onClose={() => setCategoryDelete(null)} title="Reassign Category">
        {categoryDelete && (
          <div className="space-y-4">
            <p className="text-[14px] text-muted">
              This category is used by transactions, receipt items, budget goals, or alerts. Choose where those records
              should move before deleting it.
            </p>
            <select
              value={categoryDelete.replacementId}
              onChange={(e) => setCategoryDelete({ ...categoryDelete, replacementId: e.target.value })}
              className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] font-semibold text-ink outline-none"
            >
              {categories
                .filter((category) => category.id !== categoryDelete.id)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-3">
              <ActionButton variant="outline" onClick={() => setCategoryDelete(null)} disabled={deleting}>
                Cancel
              </ActionButton>
              <ActionButton variant="danger" onClick={confirmCategoryDelete} disabled={deleting}>
                {deleting ? 'Reassigning...' : 'Reassign & Delete'}
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={tagDelete !== null} onClose={() => setTagDelete(null)} title="Delete Tag">
        {tagDelete && (
          <div className="space-y-4">
            <p className="text-[14px] text-muted">
              This tag is used by {tagUsage(tagDelete).expenses.length} transaction
              {tagUsage(tagDelete).expenses.length === 1 ? '' : 's'} and {tagUsage(tagDelete).receiptItems.length} receipt
              item{tagUsage(tagDelete).receiptItems.length === 1 ? '' : 's'}. Deleting it will remove the tag from those
              records.
            </p>
            <div className="flex gap-3">
              <ActionButton variant="outline" onClick={() => setTagDelete(null)} disabled={deleting}>
                Cancel
              </ActionButton>
              <ActionButton variant="danger" onClick={confirmTagDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Tag'}
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
