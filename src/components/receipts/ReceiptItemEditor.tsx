import { Trash2 } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { ActionButton } from '@/components/ui/ActionButton'
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
  const { categories, tags, familyMembers } = useLookups()

  if (!item) return null

  function toggleTag(id: string) {
    const next = item!.tagIds.includes(id) ? item!.tagIds.filter((t) => t !== id) : [...item!.tagIds, id]
    updateReceiptItem(itemId, { tagIds: next })
  }

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

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Category</span>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateReceiptItem(itemId, { categoryId: c.id })}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${
                item.categoryId === c.id ? 'border-primary bg-primarySoft' : 'border-line'
              }`}
            >
              <CategoryIcon icon={c.icon} color={c.color} size={32} />
              <span className="truncate w-full text-center text-[10px] font-semibold text-ink">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-semibold text-muted">Tags</span>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Chip key={t.id} color={t.color} active={item.tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
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
