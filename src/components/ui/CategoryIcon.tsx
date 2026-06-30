import { cn } from '@/utils/cn'

type Props = {
  icon: string
  color: string
  size?: number
  className?: string
}

function hexToSoft(hex: string, alpha = 0.14): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function CategoryIcon({ icon, color, size = 44, className }: Props) {
  return (
    <div
      className={cn('flex items-center justify-center rounded-2xl', className)}
      style={{ width: size, height: size, background: hexToSoft(color), fontSize: size * 0.5 }}
    >
      <span>{icon}</span>
    </div>
  )
}
