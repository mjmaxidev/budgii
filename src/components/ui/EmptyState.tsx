import type { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surfaceSoft px-6 py-10 text-center">
      {icon && <div className="mb-1 text-3xl text-muted">{icon}</div>}
      <p className="text-[16px] font-bold text-ink">{title}</p>
      {description && <p className="max-w-[260px] text-[14px] text-muted">{description}</p>}
      {action && <div className="mt-3 w-full max-w-[240px]">{action}</div>}
    </div>
  )
}
