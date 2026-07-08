import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import type { RecurringTransaction } from '@/types'

type RecurringFrequency = RecurringTransaction['frequency']

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const WEEK_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function RecurringTransactions() {
  const recurringTransactions = useStore((s) => s.recurringTransactions)
  const categories = useStore((s) => s.categories)
  const addRecurringTransaction = useStore((s) => s.addRecurringTransaction)
  const updateRecurringTransaction = useStore((s) => s.updateRecurringTransaction)
  const deleteRecurringTransaction = useStore((s) => s.deleteRecurringTransaction)
  const { familyMembers, tags, member } = useLookups()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [dayOfWeek, setDayOfWeek] = useState(String(new Date().getDay()))
  const [monthOfYear, setMonthOfYear] = useState(String(new Date().getMonth() + 1))
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [memberId, setMemberId] = useState(
    familyMembers.find((item) => item.isDefault)?.id ?? familyMembers[0]?.id ?? '',
  )
  const [tagIds, setTagIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const isValid = merchant.trim() !== '' && amount.trim() !== '' && !!categoryId

  function toggleTag(id: string) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    )
  }

  const handleAddOrUpdate = () => {
    if (!isValid) return

    const transactionData: Partial<RecurringTransaction> = {
      frequency,
      dayOfMonth:
        frequency === 'monthly' || frequency === 'quarterly' || frequency === 'yearly'
          ? parseInt(dayOfMonth)
          : undefined,
      dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? parseInt(dayOfWeek) : undefined,
      monthOfYear: frequency === 'quarterly' || frequency === 'yearly' ? parseInt(monthOfYear) : undefined,
      expense: {
        merchant,
        amount: parseFloat(amount),
        categoryId,
        memberId: memberId || undefined,
        tagIds,
        notes: notes || undefined,
      },
    }

    if (editingId) {
      updateRecurringTransaction(editingId, transactionData)
      setEditingId(null)
    } else {
      addRecurringTransaction(transactionData)
    }

    resetForm()
  }

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingId(transaction.id)
    setMerchant(transaction.expense.merchant || '')
    setAmount(transaction.expense.amount?.toString() || '')
    setFrequency(transaction.frequency)
    setDayOfMonth(transaction.dayOfMonth?.toString() || '1')
    setDayOfWeek(transaction.dayOfWeek?.toString() || String(new Date().getDay()))
    setMonthOfYear(transaction.monthOfYear?.toString() || String(new Date().getMonth() + 1))
    setCategoryId(transaction.expense.categoryId || categories[0]?.id || '')
    setMemberId(
      transaction.expense.memberId ||
        familyMembers.find((item) => item.isDefault)?.id ||
        familyMembers[0]?.id ||
        '',
    )
    setTagIds(transaction.expense.tagIds ?? [])
    setNotes(transaction.expense.notes || '')
    setShowForm(true)
  }

  const resetForm = () => {
    setMerchant('')
    setAmount('')
    setFrequency('monthly')
    setDayOfMonth('1')
    setDayOfWeek(String(new Date().getDay()))
    setMonthOfYear(String(new Date().getMonth() + 1))
    setCategoryId(categories[0]?.id || '')
    setMemberId(familyMembers.find((item) => item.isDefault)?.id ?? familyMembers[0]?.id ?? '')
    setTagIds([])
    setNotes('')
    setShowForm(false)
    setEditingId(null)
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Recurring Transactions" showBack />}>
      {/* Add Button */}
      {!showForm && (
        <ActionButton
          variant="primary"
          leftIcon={<Plus size={20} />}
          onClick={() => setShowForm(true)}
          className="mb-4"
        >
          Add Recurring Transaction
        </ActionButton>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6 space-y-4">
          <FormField
            label="Merchant / Description"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g., Netflix"
          />
          <FormField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />

          {/* Category Selection */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency Selection */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-muted">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink"
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Month (for monthly) */}
          {(frequency === 'monthly' || frequency === 'quarterly' || frequency === 'yearly') && (
            <FormField
              label="Day of Month"
              type="number"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              min="1"
              max="31"
            />
          )}

          {(frequency === 'quarterly' || frequency === 'yearly') && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-muted">
                {frequency === 'quarterly' ? 'Anchor Month' : 'Month'}
              </label>
              <select
                value={monthOfYear}
                onChange={(e) => setMonthOfYear(e.target.value)}
                className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-muted">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink"
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {familyMembers.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-muted">Family Member</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink"
              >
                <option value="">No member</option>
                {familyMembers.map((familyMember) => (
                  <option key={familyMember.id} value={familyMember.id}>
                    {familyMember.avatar} {familyMember.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-muted">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = tagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-pill border px-3 py-1.5 text-[13px] font-bold transition ${
                        selected
                          ? 'border-green bg-greenSoft text-green'
                          : 'border-line bg-surface text-muted active:bg-surfaceSoft'
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-muted mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink placeholder:text-muted focus:border-primary focus:outline-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          {!isValid && (
            <p className="text-[13px] font-semibold text-muted">
              Fill in merchant, amount, and category to continue.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <ActionButton
              variant="primary"
              onClick={handleAddOrUpdate}
              disabled={!isValid}
              className="flex-1"
            >
              {editingId ? 'Update' : 'Add'}
            </ActionButton>
            <ActionButton variant="outline" onClick={resetForm} className="flex-1">
              Cancel
            </ActionButton>
          </div>
        </Card>
      )}

      {/* Recurring Transactions List */}
      {recurringTransactions.length === 0 && !showForm ? (
        <Card className="text-center py-8">
          <p className="text-[15px] font-semibold text-muted">No recurring transactions</p>
          <p className="text-[13px] text-muted/70 mt-1">Add recurring expenses like subscriptions here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((transaction) => {
            const cat = categories.find((c) => c.id === transaction.expense.categoryId)
            return (
              <Card key={transaction.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {cat?.icon && <span className="text-lg">{cat.icon}</span>}
                      <p className="text-[15px] font-semibold text-ink truncate">
                        {transaction.expense.merchant}
                      </p>
                    </div>
                    <p className="text-[13px] text-muted">
                      ${transaction.expense.amount?.toFixed(2)} / {transaction.frequency}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {transaction.expense.memberId && (
                        <span className="rounded-pill bg-greenSoft px-2 py-0.5 text-[11px] font-bold text-green">
                          {member(transaction.expense.memberId)?.name ?? 'Member'}
                        </span>
                      )}
                      {(transaction.expense.tagIds ?? []).map((tagId) => {
                        const tag = tags.find((item) => item.id === tagId)
                        if (!tag) return null
                        return (
                          <span
                            key={tag.id}
                            className="rounded-pill px-2 py-0.5 text-[11px] font-bold"
                            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        )
                      })}
                    </div>
                    {transaction.expense.notes && (
                      <p className="text-[12px] text-muted/60 mt-1">{transaction.expense.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surfaceSoft text-primary hover:bg-primarySoft transition"
                      aria-label="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(transaction.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surfaceSoft text-muted hover:bg-red/10 transition"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="h-4" />

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete recurring transaction?"
        variant="center"
      >
        <p className="text-[15px] text-muted">
          This will stop future automatic entries. Past expenses are kept.
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="ghost" onClick={() => setConfirmDeleteId(null)}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => {
              if (confirmDeleteId) deleteRecurringTransaction(confirmDeleteId)
              setConfirmDeleteId(null)
            }}
          >
            Delete
          </ActionButton>
        </div>
      </Modal>
    </AppShell>
  )
}
