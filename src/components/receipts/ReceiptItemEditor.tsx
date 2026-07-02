import { Trash2 } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
import { ReceiptItemMetaFields } from '@/components/receipts/ReceiptItemMetaFields'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'

type Props = {
  itemId: string
  onDone: () => void
}

/** Editor for a single receipt item's name, amount, category, tags and member. */
export function ReceiptItemEditor({ itemId, onDone }: Props) {
  const item = useStore((s) => s.receiptItems.find((i) => i.id === itemId))
  const updateReceiptItem = useStore((s) => s.updateReceiptItem)
  const removeReceiptItem = useStore((s) => s.removeReceiptItem)
  const { familyMembers } = useLookups()

  if (!item) return null

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Name</span>
          <input
            value={item.name}
            onChange={(e) => updateReceiptItem(itemId, { name: e.target.value })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
        <label className="w-28">
          <span className="mb-1 block text-[13px] font-semibold text-muted">Amount</span>
          <input
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => updateReceiptItem(itemId, { amount: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
          />
        </label>
      </div>

      <ReceiptItemMetaFields
        categoryId={item.categoryId}
        tagIds={item.tagIds}
        onCategoryChange={(id) => updateReceiptItem(itemId, { categoryId: id })}
        onTagIdsChange={(ids) => updateReceiptItem(itemId, { tagIds: ids })}
      />

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Member</span>
        <div className="flex flex-wrap gap-2">
          {familyMembers.map((m) => (
            <Chip
              key={m.id}
              color="#FB8500"
              active={item.memberId === m.id}
              onClick={() => updateReceiptItem(itemId, { memberId: item.memberId === m.id ? undefined : m.id })}
            >
              {m.avatar} {m.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => {
            removeReceiptItem(itemId)
            onDone()
          }}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-input border border-red/40 px-5 text-[15px] font-bold text-red active:bg-redSoft"
        >
          <Trash2 size={18} /> Remove
        </button>
        <ActionButton variant="green" onClick={onDone}>
          Done
        </ActionButton>
      </div>
    </div>
  )
}
