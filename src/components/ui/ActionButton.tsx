import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'green' | 'greenOutline' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
  leftIcon?: ReactNode
  size?: 'md' | 'lg'
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white active:bg-[#e85f00] shadow-soft',
  secondary: 'bg-primarySoft text-primary active:bg-orangeSoft',
  outline: 'bg-surface text-primary border-2 border-primary active:bg-primarySoft',
  ghost: 'bg-transparent text-muted active:bg-line/40',
  green: 'bg-green text-white active:bg-[#138a3f] shadow-soft',
  greenOutline: 'bg-surface text-green border-2 border-green active:bg-greenSoft',
  danger: 'bg-red text-white active:bg-[#d83a3a]',
}

export function ActionButton({
  variant = 'primary',
  fullWidth = true,
  leftIcon,
  size = 'lg',
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-input font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        size === 'lg' ? 'min-h-[54px] px-5 text-[16px]' : 'min-h-[44px] px-4 text-[15px]',
        fullWidth && 'w-full',
        variants[variant],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  )
}
