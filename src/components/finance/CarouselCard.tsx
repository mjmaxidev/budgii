import type { ReactNode } from 'react'
import { MoneyText } from '@/components/ui/MoneyText'

type Props = {
  top: ReactNode
  label: string
  amount: number
  percent: number
  percentColor?: string
  bg?: string
}

/** Used for both "By Tags" and "By Members" horizontal carousels. */
export function CarouselCard({
  top,
  label,
  amount,
  percent,
  percentColor = '#16A34A',
  bg = '#FFFFFF',
}: Props) {
  return (
    <div
      className="flex w-[116px] shrink-0 flex-col items-center gap-1 rounded-card border border-line/60 px-3 py-4 text-center shadow-card"
      style={{ background: bg }}
    >
      <div className="flex h-9 items-center justify-center">{top}</div>
      <p className="truncate w-full text-[14px] font-semibold text-ink">{label}</p>
      <MoneyText amount={amount} cents={false} className="text-[18px] font-extrabold text-ink" />
      <span className="text-[13px] font-bold" style={{ color: percentColor }}>
        {percent}%
      </span>
    </div>
  )
}
