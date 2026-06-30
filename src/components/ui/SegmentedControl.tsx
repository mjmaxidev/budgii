import { cn } from '@/utils/cn'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  color?: 'primary' | 'green'
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  color = 'primary',
  className,
}: Props<T>) {
  return (
    <div className={cn('flex gap-1 rounded-pill bg-[#F4ECE2] p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-pill py-2.5 text-[15px] font-semibold transition',
              active
                ? color === 'green'
                  ? 'bg-green text-white shadow-soft'
                  : 'bg-primary text-white shadow-soft'
                : 'text-muted',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
