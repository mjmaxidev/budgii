import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptItemMetaFields } from '@/components/receipts/ReceiptItemMetaFields'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import {
  apiReceiptItemToReceiptItem,
  deleteReceiptItem as apiDeleteReceiptItem,
  updateReceiptItem as apiUpdateReceiptItem,
} from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import type { ReceiptItem } from '@/types'

type Props = {
  itemId: string
  onDone: () => void
}

/** Editor for a single receipt item's name, amount, category, tags and member. */
export function ReceiptItemEditor({ itemId, onDone }: Props) {
  const item = useStore((s) => s.receiptItems.find((i) => i.id === itemId))
  const updateReceiptItem = useStore((s) => s.updateReceiptItem)
  const removeReceiptItem = useStore((s) => s.removeReceiptItem)
  const householdId = useAuthStore((s) => s.householdId)
  const { familyMembers } = useLookups()
  const [draft, setDraft] = useState<ReceiptItem | null>(item ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item && item.id !== draft?.id) {
      setDraft(item)
      setError('')
    }
  }, [draft?.id, item])

  const current = draft ?? item

  if (!current) return null

  function patchDraft(patch: Partial<ReceiptItem>) {
    setDraft((prev) => {
      const base = prev ?? current
      return base ? { ...base, ...patch } : prev
    })
  }

  async function save() {
    if (!draft) {
      onDone()
      return
    }

    if (!isApiEnabled()) {
      updateReceiptItem(itemId, draft)
      onDone()
      return
    }

    if (!householdId) {
      setError('Sign in again to update this item.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const saved = apiReceiptItemToReceiptItem(
        await apiUpdateReceiptItem(householdId, draft.receiptId, itemId, draft),
      )
      updateReceiptItem(itemId, saved)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update item')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    const receiptId = current?.receiptId
    if (!receiptId) return

    if (!isApiEnabled()) {
      removeReceiptItem(itemId)
      onDone()
      return
    }

    if (!householdId) {
      setError('Sign in again to remove this item.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await apiDeleteReceiptItem(householdId, receiptId, itemId)
      removeReceiptItem(itemId)
      useStore.setState((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt.id === receiptId
            ? { ...receipt, itemIds: receipt.itemIds.filter((id) => id !== itemId) }
            : receipt,
        ),
      }))
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Name</span>
          <input
            value={current.name}
            onChange={(e) => patchDraft({ name: e.target.value })}
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

      <ReceiptItemMetaFields
        categoryId={current.categoryId}
        tagIds={current.tagIds}
        onCategoryChange={(id) => patchDraft({ categoryId: id })}
        onTagIdsChange={(ids) => patchDraft({ tagIds: ids })}
      />

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

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => void remove()}
          disabled={saving}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-red/40 px-5 text-[15px] font-bold text-red active:bg-redSoft"
        >
          <Trash2 size={18} /> Remove
        </button>
        <ActionButton
          variant="green"
          onClick={() => void save()}
          disabled={saving || current.amount < 0 || !current.name.trim()}
        >
          {saving ? 'Saving…' : 'Done'}
        </ActionButton>
      </div>
    </div>
  )
}
