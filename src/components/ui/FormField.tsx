import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  containerClassName?: string
}

export function FormField({ label, leftIcon, rightSlot, containerClassName, className, ...props }: Props) {
  return (
    <label className={cn('block', containerClassName)}>
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-muted">{label}</span>}
      <div className="flex items-center gap-2 rounded-input border border-line bg-surface px-4 min-h-[52px]">
        {leftIcon && <span className="text-muted">{leftIcon}</span>}
        <input
          className={cn(
            'w-full bg-transparent text-[16px] text-ink placeholder:text-muted/70 outline-none',
            className,
          )}
          {...props}
        />
        {rightSlot}
      </div>
    </label>
  )
}
