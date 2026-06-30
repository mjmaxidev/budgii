import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Camera, ImageUp, Plus, Eye, CheckCircle2, ChevronRight, Repeat } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { Chip } from '@/components/ui/Chip'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'

export function AddExpense() {
  const navigate = useNavigate()
  const addExpense = useStore((s) => s.addExpense)
  const addCategory = useStore((s) => s.addCategory)
  const addRecurringTransaction = useStore((s) => s.addRecurringTransaction)
  const { categories, tags, familyMembers } = useLookups()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [memberId, setMemberId] = useState<string | undefined>(familyMembers.find((m) => m.isDefault)?.id)
  const [notes, setNotes] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string>('')
  const [receiptSize, setReceiptSize] = useState<string>('')
  const [catModal, setCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [viewReceipt, setViewReceipt] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const cat = categories.find((c) => c.id === categoryId)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptName(file.name)
    setReceiptSize(`${Math.max(1, Math.round(file.size / 1024))} KB`)
    const reader = new FileReader()
    reader.onload = () => setReceiptPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function save() {
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
    addExpense(expenseData)

    // If recurring, also add to recurring transactions
    if (isRecurring) {
      addRecurringTransaction({
        frequency,
        expense: expenseData,
      })
    }

    navigate('/transaction-confirm', {
      state: { transaction: expenseData },
    })
  }

  function createCat() {
    if (!newCatName.trim()) return
    const id = addCategory(newCatName.trim())
    setCategoryId(id)
    setNewCatName('')
    setCatModal(false)
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
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-ink">Tags</span>
            <div className="no-scrollbar flex flex-1 flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t.id} color={t.color} active={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
                  {t.name}
                </Chip>
              ))}
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

        {/* Receipt */}
        <Card className="py-4">
          <p className="mb-3 text-[15px] font-bold text-ink">Receipt</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-line bg-surface text-[15px] font-bold text-primary active:bg-primarySoft"
            >
              <Camera size={20} /> Take Photo
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-line bg-surface text-[15px] font-bold text-green active:bg-greenSoft"
            >
              <ImageUp size={20} /> Upload Receipt
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

          {receiptPreview && (
            <div className="mt-3 flex items-center gap-3 rounded-input border border-line bg-surfaceSoft p-3">
              <img src={receiptPreview} alt="receipt" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{receiptName || 'Receipt'}</p>
                <p className="text-[12px] text-muted">{receiptSize}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-green">
                  <CheckCircle2 size={13} /> Attached
                </p>
              </div>
              <button
                onClick={() => setViewReceipt(true)}
                className="flex flex-col items-center gap-0.5 rounded-lg bg-primarySoft px-3 py-2 text-[12px] font-bold text-primary"
              >
                <Eye size={18} /> View
              </button>
            </div>
          )}
        </Card>

        <button onClick={() => setCatModal(true)} className="w-full">
          <Card className="flex items-center justify-center gap-2 py-3 text-[15px] font-bold text-ink">
            <Plus size={18} /> Create New Category
          </Card>
        </button>

        <ActionButton onClick={save}>Save Expense</ActionButton>
      </div>

      {/* Category picker / create modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Choose Category">
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
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
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
          <ActionButton fullWidth={false} onClick={createCat} className="px-5">
            Add
          </ActionButton>
        </div>
      </Modal>

      <Modal open={viewReceipt} onClose={() => setViewReceipt(false)} title="Receipt" variant="center">
        {receiptPreview && <img src={receiptPreview} alt="receipt" className="max-h-[70vh] w-full rounded-input object-contain" />}
      </Modal>
    </AppShell>
  )
}
