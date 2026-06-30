import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

type Props = {
  label: string
  value?: ReactNode
  left?: ReactNode
  onClick?: () => void
  rightIcon?: ReactNode
  className?: string
}

export function SelectRow({ label, value, left, onClick, rightIcon, className }: Props) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-input border border-line bg-surface px-4 min-h-[56px] text-left transition',
        onClick && 'active:bg-surfaceSoft',
        className,
      )}
    >
      {left}
      <span className="text-[15px] font-semibold text-ink">{label}</span>
      <span className="ml-auto flex items-center gap-2 text-[15px] text-muted">
        {value}
        {onClick && (rightIcon ?? <ChevronRight size={18} className="text-muted" />)}
      </span>
    </Tag>
  )
}
