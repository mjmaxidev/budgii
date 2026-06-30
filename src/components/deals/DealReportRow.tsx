import { ShoppingCart, Bookmark, Check } from 'lucide-react'
import type { Deal } from '@/types'
import { Card } from '@/components/ui/Card'
import { formatMoney } from '@/utils/money'

type Props = {
  deal: Deal
  onView?: () => void
  onAdd?: () => void
  onSave?: () => void
  added?: boolean
}

export function DealReportRow({ deal, onView, onAdd, onSave, added }: Props) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surfaceSoft">
          {deal.imageUrl ? (
            <img src={deal.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl">🏷️</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-pill bg-orangeSoft px-2 py-0.5 text-[11px] font-bold text-orange">
            On Sale
          </span>
          <p className="mt-1 line-clamp-2 text-[15px] font-bold leading-tight text-ink">{deal.name}</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-muted">{deal.merchant}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[13px] text-muted line-through">{formatMoney(deal.originalPrice)}</span>
          <span className="text-[18px] font-extrabold text-ink">{formatMoney(deal.salePrice)}</span>
          <span className="mt-1 rounded-pill bg-greenSoft px-2 py-0.5 text-[12px] font-bold text-green">
            {deal.discountPercent}% OFF
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line/70 p-2">
        <button
          onClick={onView}
          className="flex min-h-[44px] items-center justify-center rounded-input border border-green/60 text-[14px] font-bold text-green active:bg-greenSoft"
        >
          View
        </button>
        {added ? (
          <button
            disabled
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-input bg-greenSoft text-[14px] font-bold text-green"
          >
            <Check size={16} /> Added
          </button>
        ) : onAdd ? (
          <button
            onClick={onAdd}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-input border border-green/60 text-[14px] font-bold text-green active:bg-greenSoft"
          >
            <ShoppingCart size={16} /> Add to List
          </button>
        ) : (
          <button
            onClick={onSave}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-input border border-primary/50 text-[14px] font-bold text-primary active:bg-primarySoft"
          >
            <Bookmark size={16} /> Save for Later
          </button>
        )}
      </div>
    </Card>
  )
}
