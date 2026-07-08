import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  iconBg?: string
}

export function ToggleRow({ icon, title, description, checked, onChange, iconBg = '#EAF8ED' }: Props) {
  return (
    <div className="flex items-center gap-3 py-1">
      {icon && (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {description && <p className="text-[13px] leading-snug text-muted">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-pill transition', checked ? 'bg-green' : 'bg-line')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
