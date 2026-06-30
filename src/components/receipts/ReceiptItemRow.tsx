import { Pencil } from 'lucide-react'
import type { ReceiptItem } from '@/types'
import { MoneyText } from '@/components/ui/MoneyText'
import { useLookups } from '@/store/lookups'

type Props = {
  item: ReceiptItem
  onEdit?: () => void
}

const itemEmoji: Record<string, string> = {
  'Milk 1%': '🥛',
  'Organic Bananas': '🍌',
  'Greek Yogurt': '🥣',
  'Whole Grain Bread': '🍞',
  'Coffee Beans': '☕',
  'Uber Trip': '🚗',
}

export function ReceiptItemRow({ item, onEdit }: Props) {
  const { category } = useLookups()
  const cat = category(item.categoryId)
  const confidence = Math.round(item.aiConfidence * 100)
  const high = confidence >= 90

  return (
    <div className="flex items-center gap-3 border-b border-line/70 py-3 last:border-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surfaceSoft text-xl">
        {itemEmoji[item.name] ?? cat?.icon ?? '🧾'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{item.name}</p>
        <p className="text-[13px] font-semibold" style={{ color: cat?.color ?? '#6B7280' }}>
          {cat?.name ?? 'Uncategorized'}
        </p>
      </div>
      <span
        className="rounded-pill px-2 py-1 text-[12px] font-bold"
        style={{
          background: high ? '#EAF8ED' : '#FFF2DF',
          color: high ? '#16A34A' : '#FB8500',
        }}
      >
        {confidence}%
      </span>
      <MoneyText amount={item.amount} className="w-16 text-right text-[15px] font-bold text-ink" />
      {onEdit && (
        <button onClick={onEdit} className="rounded-full p-1.5 text-muted active:bg-line/40" aria-label="Edit item">
          <Pencil size={18} />
        </button>
      )}
    </div>
  )
}
