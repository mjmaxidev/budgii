import { formatMoney } from '@/utils/money'
import { cn } from '@/utils/cn'

type Props = {
  amount: number
  className?: string
  signed?: boolean
  cents?: boolean
}

export function MoneyText({ amount, className, signed, cents = true }: Props) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(amount, { sign: signed, cents })}</span>
}
