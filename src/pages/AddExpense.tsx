import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, ChevronRight, Repeat } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { Chip } from '@/components/ui/Chip'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ColorPickerField } from '@/components/ui/ColorPickerField'
import { Modal } from '@/components/ui/Modal'
import { CategoryCreateModal, CategoryAddTile } from '@/components/finance/CategoryCreateModal'
import { TAG_COLOR_CHOICES } from '@/constants/tagChoices'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { apiExpenseToExpense, createExpense } from '@/api/expenses'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'

export function AddExpense() {
  const navigate = useNavigate()
  const addExpense = useStore((s) => s.addExpense)
  const addTag = useStore((s) => s.addTag)
  const addRecurringTransaction = useStore((s) => s.addRecurringTransaction)
  const householdId = useAuthStore((s) => s.householdId)
  const { categories, tags, familyMembers } = useLookups()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [memberId, setMemberId] = useState<string | undefined>(familyMembers.find((m) => m.isDefault)?.id)
  const [notes, setNotes] = useState('')
  const [catModal, setCatModal] = useState(false)
  const [catCreateModal, setCatCreateModal] = useState(false)
  const [tagModal, setTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_CHOICES[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const cat = categories.find((c) => c.id === categoryId)

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function save() {
    const expenseData = {
      amount: parseFloat(amount) || 0,
      date: new Date(date).toISOString(),
      merchant,
      categoryId,
      tagIds,
      memberId,
      notes: notes || undefined,
      source: 'manual' as const,
    }

    if (isApiEnabled()) {
      if (!householdId) {
        setSubmitError('Sign in again to save this expense.')
        return
      }

      setSubmitting(true)
      setSubmitError('')
      try {
        const saved = apiExpenseToExpense(await createExpense(householdId, expenseData))
        addExpense(saved)
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Could not save expense')
        setSubmitting(false)
        return
      }
    } else {
      addExpense(expenseData)
    }

    // If recurring, also add to recurring transactions
    if (isRecurring) {
      const scheduledDate = new Date(`${date}T00:00:00`)
      addRecurringTransaction({
        frequency,
        dayOfWeek: frequency === 'weekly' ? scheduledDate.getDay() : undefined,
        dayOfMonth: frequency === 'monthly' || frequency === 'yearly' ? scheduledDate.getDate() : undefined,
        monthOfYear: frequency === 'yearly' ? scheduledDate.getMonth() + 1 : undefined,
        expense: expenseData,
      })
    }

    navigate('/transaction-confirm', {
      state: { transaction: expenseData },
    })
  }

  function openCategoryCreate() {
    setCatModal(false)
    setCatCreateModal(true)
  }

  function onCategoryCreated(id: string) {
    setCategoryId(id)
    setCatCreateModal(false)
  }

  function createTag() {
    if (!newTagName.trim()) return
    const id = addTag(newTagName.trim(), newTagColor)
    setTagIds((prev) => [...prev, id])
    setNewTagName('')
    setNewTagColor(TAG_COLOR_CHOICES[0])
    setTagModal(false)
  }

  return (
    <AppShell topBar={<TopBar title="Add Expense" showBack />}>
      {/* Amount */}
      <Card className="py-6">
        <label className="flex cursor-text items-center gap-2">
          <span className="text-[40px] font-extrabold text-muted">$</span>
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              // allow digits and a single decimal point with up to 2 decimals
              const cleaned = e.target.value.replace(/[^0-9.]/g, '')
              const parts = cleaned.split('.')
              const next = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}` : cleaned
              setAmount(next)
            }}
            placeholder="0.00"
            className="w-full bg-transparent text-[44px] font-extrabold text-primary placeholder:text-primary/40 outline-none"
          />
        </label>
      </Card>

      <div className="mt-3 space-y-3">
        {/* Date */}
        <Card className="flex items-center justify-between py-3">
          <span className="text-[15px] font-bold text-ink">Date</span>
          <label className="flex items-center gap-2 text-[15px] text-muted">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-right outline-none"
            />
            <Calendar size={18} />
          </label>
        </Card>

        {/* Merchant */}
        <Card className="flex items-center justify-between gap-3 py-3">
          <span className="text-[15px] font-bold text-ink">Merchant</span>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Amazon"
            className="flex-1 bg-transparent text-right text-[15px] text-ink placeholder:text-muted/70 outline-none"
          />
        </Card>

        {/* Category */}
        <button onClick={() => setCatModal(true)} className="w-full">
          <Card className="flex items-center justify-between py-3">
            <span className="text-[15px] font-bold text-ink">Category</span>
            <span className="flex items-center gap-2">
              {cat && <CategoryIcon icon={cat.icon} color={cat.color} size={32} />}
              <span className="text-[15px] text-muted">{cat?.name ?? 'Select'}</span>
              <ChevronRight size={18} className="text-muted" />
            </span>
          </Card>
        </button>

        {/* Tags */}
        <Card className="py-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 pt-1 text-[15px] font-bold text-ink">Tags</span>
            <div className="flex flex-1 flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t.id} color={t.color} active={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
                  {t.name}
                </Chip>
              ))}
              <button
                type="button"
                onClick={() => setTagModal(true)}
                className="inline-flex items-center gap-1 rounded-pill border-2 border-dashed border-line px-3 py-1.5 text-[13px] font-bold text-muted active:bg-surfaceSoft"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </Card>

        {/* Member */}
        <Card className="py-3">
          <div className="mb-2 text-[15px] font-bold text-ink">Family member</div>
          <div className="flex flex-wrap gap-2">
            {familyMembers.map((m) => (
              <Chip key={m.id} color="#FB8500" active={memberId === m.id} onClick={() => setMemberId(memberId === m.id ? undefined : m.id)}>
                {m.avatar} {m.name}
              </Chip>
            ))}
          </div>
        </Card>

        {/* Notes */}
        <Card className="flex items-start justify-between gap-3 py-3">
          <span className="pt-0.5 text-[15px] font-bold text-ink">Notes</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note"
            className="flex-1 bg-transparent text-right text-[15px] text-ink placeholder:text-muted/70 outline-none"
          />
        </Card>

        {/* Repeat this expense */}
        <Card className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-muted" />
            <span className="text-[15px] font-bold text-ink">Repeat this expense?</span>
          </div>
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className={`h-6 w-10 rounded-full transition-colors ${
              isRecurring ? 'bg-green' : 'bg-line/50'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                isRecurring ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </Card>

        {/* Frequency selector (shown if recurring) */}
        {isRecurring && (
          <Card className="py-3">
            <p className="mb-2 text-[14px] font-bold text-ink">How often?</p>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                    frequency === freq
                      ? 'bg-primary text-white'
                      : 'bg-line/30 text-ink'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </Card>
        )}

        {submitError && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            {submitError}
          </p>
        )}
        <ActionButton onClick={() => void save()} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Expense'}
        </ActionButton>
      </div>

      {/* Category picker */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Choose Category">
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoryId(c.id)
                setCatModal(false)
              }}
              className={`flex flex-col items-center gap-1.5 rounded-card border p-3 ${
                categoryId === c.id ? 'border-primary bg-primarySoft' : 'border-line bg-surface'
              }`}
            >
              <CategoryIcon icon={c.icon} color={c.color} size={40} />
              <span className="truncate text-[12px] font-semibold text-ink">{c.name}</span>
            </button>
          ))}
          <CategoryAddTile onClick={openCategoryCreate} />
        </div>
      </Modal>

      <CategoryCreateModal
        open={catCreateModal}
        onClose={() => {
          setCatCreateModal(false)
          setCatModal(true)
        }}
        onSaved={onCategoryCreated}
      />

      <Modal open={tagModal} onClose={() => setTagModal(false)} title="Create Tag">
        <p className="mb-4 text-[14px] text-muted">Add a custom tag for this expense and future ones.</p>
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Tag name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <ColorPickerField value={newTagColor} onChange={setNewTagColor} presets={TAG_COLOR_CHOICES} label="Colour" />
        {newTagName.trim() && (
          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Preview</p>
            <Chip color={newTagColor} active>
              {newTagName.trim()}
            </Chip>
          </div>
        )}
        <ActionButton onClick={createTag} className="mt-5" leftIcon={<Plus size={18} />}>
          Add Tag
        </ActionButton>
      </Modal>
    </AppShell>
  )
}
