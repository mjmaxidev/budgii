import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptThumbnail } from '@/components/receipts/ReceiptThumbnail'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import {
  apiExpenseToExpense,
  deleteExpense as apiDeleteExpense,
  updateExpense as apiUpdateExpense,
} from '@/api/expenses'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import { withFrom } from '@/utils/navigation'
import type { Expense } from '@/types'

type Props = {
  expenseId: string
  onDone: () => void
}

export function ExpenseEditor({ expenseId, onDone }: Props) {
  const navigate = useNavigate()
  const expense = useStore((s) => s.expenses.find((e) => e.id === expenseId))
  const receipt = useStore((s) => s.receipts.find((r) => r.id === expense?.receiptId))
  const updateExpense = useStore((s) => s.updateExpense)
  const deleteExpense = useStore((s) => s.deleteExpense)
  const householdId = useAuthStore((s) => s.householdId)
  const { categories, tags, familyMembers } = useLookups()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState<Expense | null>(expense ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (expense && expense.id !== draft?.id) {
      setDraft(expense)
      setError('')
    }
  }, [draft?.id, expense])

  const current = draft ?? expense

  if (!current) return null

  function patchDraft(patch: Partial<Expense>) {
    setDraft((prev) => {
      const base = prev ?? current
      return base ? { ...base, ...patch } : prev
    })
  }

  function toggleTag(id: string) {
    const next = current!.tagIds.includes(id)
      ? current!.tagIds.filter((t) => t !== id)
      : [...current!.tagIds, id]
    patchDraft({ tagIds: next })
  }

  async function save() {
    if (!draft) {
      onDone()
      return
    }

    if (!isApiEnabled()) {
      updateExpense(expenseId, draft)
      onDone()
      return
    }

    if (!householdId) {
      setError('Sign in again to update this expense.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const saved = apiExpenseToExpense(await apiUpdateExpense(householdId, expenseId, draft))
      updateExpense(expenseId, saved)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update expense')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!isApiEnabled()) {
      deleteExpense(expenseId)
      onDone()
      return
    }

    if (!householdId) {
      setError('Sign in again to delete this expense.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await apiDeleteExpense(householdId, expenseId)
      deleteExpense(expenseId)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Merchant</span>
          <input
            value={current.merchant}
            onChange={(e) => patchDraft({ merchant: e.target.value })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
        <label className="w-28">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Amount</span>
          <input
            inputMode="decimal"
            value={current.amount}
            onChange={(e) => patchDraft({ amount: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-muted">Date</span>
        <input
          type="date"
          value={current.date.slice(0, 10)}
          onChange={(e) => patchDraft({ date: new Date(e.target.value).toISOString() })}
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
      </label>

      {receipt && (
        <button
          type="button"
          onClick={() => {
            onDone()
            navigate(`/receipt-viewer/${receipt.id}`, withFrom('/transactions'))
          }}
          className="flex w-full items-center gap-3 rounded-input border border-line bg-surface p-3 text-left active:bg-line/30"
        >
          <ReceiptThumbnail
            receiptId={receipt.id}
            uploadId={receipt.uploadId}
            imageUrl={receipt.imageUrl}
            className="h-14 w-11 shrink-0"
            rounded="rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <FileText size={14} className="text-primary" />
              View scanned receipt
            </p>
            <p className="truncate text-[12px] text-muted">{receipt.merchant}</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </button>
      )}

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Category</span>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => patchDraft({ categoryId: c.id })}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${
                current.categoryId === c.id ? 'border-primary bg-primarySoft' : 'border-line'
              }`}
            >
              <CategoryIcon icon={c.icon} color={c.color} size={30} />
              <span className="truncate w-full text-center text-[10px] font-semibold text-ink">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Tags</span>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Chip
              key={t.id}
              color={t.color}
              active={current.tagIds.includes(t.id)}
              onClick={() => toggleTag(t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Member</span>
        <div className="flex flex-wrap gap-2">
          {familyMembers.map((m) => (
            <Chip
              key={m.id}
              color="#FB8500"
              active={current.memberId === m.id}
              onClick={() => patchDraft({ memberId: current.memberId === m.id ? undefined : m.id })}
            >
              {m.avatar} {m.name}
            </Chip>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
      )}

      {confirmDelete ? (
        <div className="rounded-input bg-redSoft p-3">
          <p className="mb-3 text-[14px] font-semibold text-ink">Delete this expense permanently?</p>
          <div className="flex gap-3">
            <ActionButton variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" onClick={() => void remove()} disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-red/40 px-5 text-[15px] font-bold text-red active:bg-redSoft"
          >
            <Trash2 size={18} /> Delete
          </button>
          <ActionButton onClick={() => void save()} disabled={saving || current.amount <= 0}>
            {saving ? 'Saving…' : 'Done'}
          </ActionButton>
        </div>
      )}
    </div>
  )
}
