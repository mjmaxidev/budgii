import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'

type Props = {
  monthLabel: string
  isCurrent: boolean
  ongoingTotal: number
  manualTotal: number
  monthTotal: number
  onShiftMonth: (delta: number) => void
}

export function IncomeSummary({
  monthLabel,
  isCurrent,
  ongoingTotal,
  manualTotal,
  monthTotal,
  onShiftMonth,
}: Props) {
  return (
    <>
      <Card className="mt-3 flex items-center justify-between py-3">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
          aria-label="Previous month"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-[17px] font-bold text-ink">{monthLabel}</p>
          {isCurrent && <p className="text-[12px] font-semibold text-primary">This month</p>}
        </div>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
          aria-label="Next month"
        >
          <ChevronRight size={22} />
        </button>
      </Card>

      <Card className="mt-3 flex flex-col items-center gap-2 bg-green/10 py-5">
        <span className="text-[14px] font-semibold text-muted">Income this month</span>
        <MoneyText amount={monthTotal} className="text-[40px] font-extrabold text-green" />
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-[13px] text-muted">
          {ongoingTotal > 0 && (
            <span>
              Ongoing <span className="font-semibold text-ink">${ongoingTotal.toFixed(0)}</span>
            </span>
          )}
          {manualTotal > 0 && (
            <span>
              One-time <span className="font-semibold text-ink">${manualTotal.toFixed(0)}</span>
            </span>
          )}
        </div>
      </Card>
    </>
  )
}
