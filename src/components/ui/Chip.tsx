import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { hexToHsl } from '@/utils/color'

type Props = {
  children: ReactNode
  color?: string
  active?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md'
}

function hexToSoft(hex: string, alpha = 0.16): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Chip({ children, color = '#E5A97A', active = false, onClick, className, size = 'md' }: Props) {
  const interactive = !!onClick
  const textColor = active ? (hexToHsl(color).l > 62 ? '#3D3229' : '#fff') : color
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      style={
        active
          ? { backgroundColor: color, color: textColor }
          : { backgroundColor: hexToSoft(color), color }
      }
      className={cn(
        'inline-flex items-center rounded-pill font-semibold whitespace-nowrap transition',
        size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
        interactive && 'active:scale-95',
        !interactive && 'cursor-default',
        className,
      )}
    >
      {children}
    </button>
  )
}
