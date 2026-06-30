import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

type Props = {
  title?: string
  showBack?: boolean
  onBack?: () => void
  right?: ReactNode
  left?: ReactNode
  className?: string
}

export function TopBar({ title, showBack, onBack, right, left, className }: Props) {
  const navigate = useNavigate()
  return (
    <header className={cn('flex items-center gap-2 px-4 pt-2 pb-3', className)}>
      <div className="flex w-10 items-center">
        {showBack ? (
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-line/40"
            aria-label="Back"
          >
            <ChevronLeft size={26} />
          </button>
        ) : (
          left
        )}
      </div>
      <h1 className="flex-1 text-center text-[19px] font-bold text-ink">{title}</h1>
      <div className="flex w-10 items-center justify-end">{right}</div>
    </header>
  )
}
