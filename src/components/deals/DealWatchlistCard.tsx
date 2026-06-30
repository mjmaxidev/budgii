import { ChevronRight, Tag, Sparkles, Eye, Clock, Check } from 'lucide-react'
import type { WatchlistItem } from '@/types'
import { formatMoney } from '@/utils/money'
import { cn } from '@/utils/cn'

type Props = {
  item: WatchlistItem
  onClick?: () => void
  /** edit mode: show a selection checkbox instead of the chevron */
  selectable?: boolean
  selected?: boolean
}

const badge = {
  on_sale: { label: 'On Sale', icon: Tag, bg: '#FFF2DF', color: '#FB8500' },
  new_deal: { label: 'New Deal', icon: Sparkles, bg: '#EAF8ED', color: '#16A34A' },
  watching: { label: 'Watching', icon: Eye, bg: '#F4ECE2', color: '#6B7280' },
} as const

export function DealWatchlistCard({ item, onClick, selectable = false, selected = false }: Props) {
  const b = badge[item.status]
  const Icon = b.icon
  const discount =
    item.originalPrice && item.currentPrice
      ? Math.round((1 - item.currentPrice / item.originalPrice) * 100)
      : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border bg-surface p-3 text-left shadow-card transition active:bg-surfaceSoft',
        selectable && selected ? 'border-primary ring-1 ring-primary' : 'border-line/60',
      )}
    >
      {selectable && (
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-line bg-surface',
          )}
        >
          {selected && <Check size={14} className="text-white" />}
        </div>
      )}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surfaceSoft">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{item.name}</p>
        <p className="truncate text-[13px] text-muted">{item.merchant}</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-pill bg-orangeSoft px-2 py-0.5 text-[11px] font-semibold text-orange">
          <Clock size={11} /> Waiting for sale
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-[12px] font-bold"
          style={{ background: b.bg, color: b.color }}
        >
          <Icon size={12} /> {b.label}
        </span>
        {item.currentPrice != null && (
          <span className="text-[15px] font-extrabold" style={{ color: discount > 0 ? b.color : '#111827' }}>
            {formatMoney(item.currentPrice)}
          </span>
        )}
        {item.originalPrice && discount > 0 ? (
          <span className="text-[12px] text-muted line-through">{formatMoney(item.originalPrice)}</span>
        ) : (
          <span className="text-[12px] text-muted">No deal yet</span>
        )}
        {discount > 0 && <span className="text-[12px] font-bold text-green">{discount}% off</span>}
      </div>
      {!selectable && <ChevronRight size={18} className="shrink-0 text-muted" />}
    </button>
  )
}
