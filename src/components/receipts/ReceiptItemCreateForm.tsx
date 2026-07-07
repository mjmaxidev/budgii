import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptItemMetaFields } from '@/components/receipts/ReceiptItemMetaFields'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { apiReceiptItemToReceiptItem, createReceiptItem } from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'

type Props = {
  receiptId: string
  onDone: () => void
}

export function ReceiptItemCreateForm({ receiptId, onDone }: Props) {
  const addReceiptItem = useStore((s) => s.addReceiptItem)
  const householdId = useAuthStore((s) => s.householdId)
  const { categories, familyMembers } = useLookups()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [memberId, setMemberId] = useState<string | undefined>(
    familyMembers.find((m) => m.isDefault)?.id,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim() || !categoryId) return
    const input = {
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      categoryId,
      tagIds,
      memberId,
      aiConfidence: 1,
      manuallyEdited: true,
    }

    if (isApiEnabled()) {
      if (!householdId) {
        setError('Sign in again to save this item.')
        return
      }

      setSaving(true)
      setError('')
      try {
        const saved = apiReceiptItemToReceiptItem(await createReceiptItem(householdId, receiptId, input))
        useStore.setState((state) => ({
          receiptItems: [saved, ...state.receiptItems],
          receipts: state.receipts.map((receipt) =>
            receipt.id === receiptId
              ? { ...receipt, itemIds: receipt.itemIds.includes(saved.id) ? receipt.itemIds : [...receipt.itemIds, saved.id] }
              : receipt,
          ),
        }))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not save item')
        setSaving(false)
        return
      }
    } else {
      addReceiptItem(receiptId, input)
    }
    onDone()
  }

  const canSave = name.trim().length > 0 && categoryId

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paper towels"
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
        <label className="w-28">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Amount</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9.]/g, '')
              const parts = cleaned.split('.')
              const next = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}` : cleaned
              setAmount(next)
            }}
            placeholder="0.00"
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
      </div>

      <ReceiptItemMetaFields
        categoryId={categoryId}
        tagIds={tagIds}
        onCategoryChange={setCategoryId}
        onTagIdsChange={setTagIds}
      />

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Member</span>
        <div className="flex flex-wrap gap-2">
          {familyMembers.map((m) => (
            <Chip
              key={m.id}
              color="#FB8500"
              active={memberId === m.id}
              onClick={() => setMemberId(memberId === m.id ? undefined : m.id)}
            >
              {m.avatar} {m.name}
            </Chip>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
          {error}
        </p>
      )}

      <ActionButton variant="green" onClick={() => void save()} disabled={!canSave || saving}>
        {saving ? 'Saving…' : 'Save Item'}
      </ActionButton>
    </div>
  )
}
