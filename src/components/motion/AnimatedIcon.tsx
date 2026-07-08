import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  children: ReactNode
  active?: boolean
  className?: string
}

export function AnimatedIcon({ children, active, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex transition-transform duration-200',
        active && 'motion-icon-pop',
        className,
      )}
    >
      {children}
    </span>
  )
}
