import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  soft?: boolean
  padded?: boolean
}

export function Card({ className, soft, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line/60 shadow-card',
        soft ? 'bg-surfaceSoft' : 'bg-surface',
        padded && 'p-4',
        className,
      )}
      {...props}
    />
  )
}
