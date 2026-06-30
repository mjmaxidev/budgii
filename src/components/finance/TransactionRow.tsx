import { ChevronRight } from 'lucide-react'
import type { Expense } from '@/types'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { formatDate } from '@/utils/dates'
import { useLookups } from '@/store/lookups'
import { Chip } from '@/components/ui/Chip'

type Props = {
  expense: Expense
  onClick?: () => void
  showChips?: boolean
}

export function TransactionRow({ expense, onClick, showChips }: Props) {
  const { category, tag, member } = useLookups()
  const cat = category(expense.categoryId)
  const mem = member(expense.memberId)

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left transition active:bg-surfaceSoft"
    >
      <CategoryIcon icon={cat?.icon ?? '💸'} color={cat?.color ?? '#6B7280'} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{expense.merchant || cat?.name}</p>
        <p className="text-[13px] text-muted">{formatDate(expense.date)}</p>
        {showChips && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cat && <Chip color={cat.color} size="sm">{cat.name}</Chip>}
            {expense.tagIds.slice(0, 1).map((id) => {
              const t = tag(id)
              return t ? <Chip key={id} color={t.color} size="sm">{t.name}</Chip> : null
            })}
            {mem && <Chip color="#FB8500" size="sm">{mem.name}</Chip>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <MoneyText amount={-expense.amount} className="text-[15px] font-bold text-ink" />
        {onClick && <ChevronRight size={18} className="text-muted" />}
      </div>
    </button>
  )
}
