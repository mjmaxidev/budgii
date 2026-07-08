import { Pencil } from 'lucide-react'
import type { ReceiptItem } from '@/types'
import { MoneyText } from '@/components/ui/MoneyText'
import { useLookups } from '@/store/lookups'
import { iconForItemName } from '@/utils/itemIcon'

type Props = {
  item: ReceiptItem
  onEdit?: () => void
  onMatchClick?: (confidence: number) => void
}

export function ReceiptItemRow({ item, onEdit, onMatchClick }: Props) {
  const { category } = useLookups()
  const cat = category(item.categoryId)
  const isManual = item.manuallyEdited
  const confidence = Math.round(item.aiConfidence * 100)
  const high = confidence >= 90

  return (
    <div className="flex items-center gap-2.5 border-b border-line/70 py-3 last:border-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surfaceSoft text-lg">
        {iconForItemName(item.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-bold text-ink">{item.name}</p>
          <MoneyText amount={item.amount} className="shrink-0 text-[15px] font-bold text-ink" />
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold" style={{ color: cat?.color ?? '#6B7280' }}>
            {cat?.name ?? 'Uncategorized'}
          </p>
          {isManual ? (
            <span className="shrink-0 text-[11px] font-medium text-muted">· You added</span>
          ) : (
            <button
              type="button"
              onClick={() => onMatchClick?.(confidence)}
              className="shrink-0 rounded-pill px-1.5 py-px text-[11px] font-bold active:opacity-70"
              style={{
                background: high ? '#EAF8ED' : '#FFF2DF',
                color: high ? '#16A34A' : '#FB8500',
              }}
              aria-label={`${confidence}% category match — tap for info`}
            >
              {confidence}%
            </button>
          )}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="shrink-0 rounded-full p-1.5 text-muted active:bg-line/40"
          aria-label="Edit item"
        >
          <Pencil size={17} />
        </button>
      )}
    </div>
  )
}
