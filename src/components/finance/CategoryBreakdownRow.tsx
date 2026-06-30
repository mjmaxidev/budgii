import { ChevronRight } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MoneyText } from '@/components/ui/MoneyText'

type Props = {
  icon: string
  color: string
  name: string
  amount: number
  percent: number
  onClick?: () => void
}

export function CategoryBreakdownRow({ icon, color, name, amount, percent, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left transition active:bg-surfaceSoft"
    >
      <CategoryIcon icon={icon} color={color} size={44} />
      <div className="min-w-0 flex-1">
        <p className="mb-2 truncate text-[15px] font-semibold text-ink">{name}</p>
        <ProgressBar progress={percent / 100} color={color} />
      </div>
      <div className="flex w-[92px] items-center justify-end gap-1">
        <div className="text-right">
          <p className="text-[13px] font-medium text-muted">{percent}%</p>
          <MoneyText amount={amount} cents={false} className="text-[15px] font-bold text-ink" />
        </div>
        {onClick && <ChevronRight size={16} className="text-muted" />}
      </div>
    </button>
  )
}
