import { Zap, Tag, Heart } from 'lucide-react'
import type { Deal } from '@/types'
import { formatMoney } from '@/utils/money'

type Props = {
  deal: Deal
  /** stacked behind cards get scaled/offset */
  depth?: number
}

export function DealSwipeCard({ deal, depth = 0 }: Props) {
  return (
    <div
      className="absolute inset-x-0 top-0 rounded-card border border-line/60 bg-surface p-4 shadow-ring"
      style={{
        transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
        zIndex: 10 - depth,
        opacity: depth > 2 ? 0 : 1,
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1.5 text-[13px] font-bold text-white">
          <Zap size={14} /> Today only
        </span>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surfaceSoft text-primary shadow-card">
          <Heart size={18} />
        </button>
      </div>

      <div className="flex h-44 items-center justify-center rounded-2xl bg-surfaceSoft">
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt="" className="h-full w-full rounded-2xl object-contain" />
        ) : (
          <span className="text-6xl">🛍️</span>
        )}
      </div>

      <h2 className="mt-4 text-[20px] font-extrabold leading-tight text-ink">{deal.name}</h2>
      <p className="mt-1 text-[14px] font-semibold text-muted">{deal.merchant}</p>

      <div className="my-3 h-px bg-line" />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[14px] text-muted line-through">{formatMoney(deal.originalPrice)}</p>
          <p className="text-[26px] font-extrabold text-ink">{formatMoney(deal.salePrice)}</p>
        </div>
        <div className="text-right">
          <span className="rounded-pill bg-greenSoft px-2.5 py-1 text-[13px] font-bold text-green">
            {deal.discountPercent}% OFF
          </span>
          <p className="mt-1 text-[13px] font-semibold text-green">
            You save {formatMoney(deal.originalPrice - deal.salePrice)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-input bg-greenSoft px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-green">
          <Tag size={15} /> Best deal
        </span>
        <span className="text-[13px] text-muted">Limited time offer</span>
      </div>
    </div>
  )
}
