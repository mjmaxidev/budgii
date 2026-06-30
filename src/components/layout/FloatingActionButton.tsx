import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  onClick: () => void
  icon: ReactNode
  label?: string
  className?: string
}

export function FloatingActionButton({ onClick, icon, label, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute bottom-6 right-5 z-30 flex items-center gap-2 rounded-pill bg-primary px-5 py-4 font-bold text-white shadow-ring active:scale-95',
        className,
      )}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  )
}
