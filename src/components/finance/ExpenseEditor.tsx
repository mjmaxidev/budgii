import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'

type Props = {
  expenseId: string
  onDone: () => void
}

export function ExpenseEditor({ expenseId, onDone }: Props) {
  const expense = useStore((s) => s.expenses.find((e) => e.id === expenseId))
  const updateExpense = useStore((s) => s.updateExpense)
  const deleteExpense = useStore((s) => s.deleteExpense)
  const { categories, tags, familyMembers } = useLookups()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!expense) return null

  function toggleTag(id: string) {
    const next = expense!.tagIds.includes(id) ? expense!.tagIds.filter((t) => t !== id) : [...expense!.tagIds, id]
    updateExpense(expenseId, { tagIds: next })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Merchant</span>
          <input
            value={expense.merchant}
            onChange={(e) => updateExpense(expenseId, { merchant: e.target.value })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
        <label className="w-28">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Amount</span>
          <input
            inputMode="decimal"
            value={expense.amount}
            onChange={(e) => updateExpense(expenseId, { amount: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[13px] font-semibold text-muted">Date</span>
        <input
          type="date"
          value={expense.date.slice(0, 10)}
          onChange={(e) => updateExpense(expenseId, { date: new Date(e.target.value).toISOString() })}
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
      </label>

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Category</span>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateExpense(expenseId, { categoryId: c.id })}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${
                expense.categoryId === c.id ? 'border-primary bg-primarySoft' : 'border-line'
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
            <Chip key={t.id} color={t.color} active={expense.tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
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
              active={expense.memberId === m.id}
              onClick={() => updateExpense(expenseId, { memberId: expense.memberId === m.id ? undefined : m.id })}
            >
              {m.avatar} {m.name}
            </Chip>
          ))}
        </div>
      </div>

      {confirmDelete ? (
        <div className="rounded-input bg-redSoft p-3">
          <p className="mb-3 text-[14px] font-semibold text-ink">Delete this expense permanently?</p>
          <div className="flex gap-3">
            <ActionButton variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </ActionButton>
            <ActionButton
              variant="danger"
              onClick={() => {
                deleteExpense(expenseId)
                onDone()
              }}
            >
              Delete
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-red/40 px-5 text-[15px] font-bold text-red active:bg-redSoft"
          >
            <Trash2 size={18} /> Delete
          </button>
          <ActionButton onClick={onDone}>Done</ActionButton>
        </div>
      )}
    </div>
  )
}
