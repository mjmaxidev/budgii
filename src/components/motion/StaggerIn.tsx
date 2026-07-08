import { Children, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type Props = {
  children: ReactNode
  className?: string
  staggerMs?: number
}

export function StaggerIn({ children, className, staggerMs = 70 }: Props) {
  const reduced = usePrefersReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={className}>
      {Children.map(children, (child, index) => (
        <div key={index} className="motion-stagger-item" style={{ animationDelay: `${index * staggerMs}ms` }}>
          {child}
        </div>
      ))}
    </div>
  )
}
