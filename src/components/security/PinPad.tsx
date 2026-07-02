import { Delete } from 'lucide-react'
import { PIN_LENGTH } from '@/utils/pin'
import { cn } from '@/utils/cn'

type Props = {
  value: string
  onChange: (value: string) => void
  onComplete?: (pin: string) => void
  error?: string
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function PinPad({ value, onChange, onComplete, error, disabled }: Props) {
  function press(key: (typeof KEYS)[number]) {
    if (disabled) return
    if (key === '') return
    if (key === 'del') {
      onChange(value.slice(0, -1))
      return
    }
    if (value.length >= PIN_LENGTH) return
    const next = value + key
    onChange(next)
    if (next.length === PIN_LENGTH) onComplete?.(next)
  }

  return (
    <div>
      <div className="mb-2 flex justify-center gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3.5 w-3.5 rounded-full border-2 transition',
              i < value.length ? 'border-primary bg-primary' : 'border-line bg-surface',
              error && 'border-red',
            )}
          />
        ))}
      </div>
      {error && <p className="mb-4 text-center text-[13px] font-semibold text-red">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, idx) => {
          if (key === '') return <div key={idx} />
          const isDel = key === 'del'
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              className={cn(
                'flex h-14 items-center justify-center rounded-2xl text-[22px] font-bold transition active:scale-95',
                isDel ? 'bg-line/30 text-muted' : 'bg-surface text-ink shadow-card active:bg-surfaceSoft',
                disabled && 'opacity-50',
              )}
              aria-label={isDel ? 'Delete' : key}
            >
              {isDel ? <Delete size={22} /> : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
