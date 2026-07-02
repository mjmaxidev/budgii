import { useState } from 'react'
import { Palette } from 'lucide-react'
import { cn } from '@/utils/cn'
import { CHALK_TONE_PRESET } from '@/constants/chalkColors'
import { normalizeHex } from '@/utils/color'
import { ColorWheelPanel } from '@/components/ui/ColorWheelPanel'

export { normalizeHex } from '@/utils/color'

type Props = {
  value: string
  onChange: (color: string) => void
  presets: string[]
  label?: string
  swatchSize?: 'sm' | 'md'
}

export function ColorPickerField({ value, onChange, presets, label, swatchSize = 'sm' }: Props) {
  const [wheelOpen, setWheelOpen] = useState(false)
  const normalized = normalizeHex(value)
  const isCustom = !presets.some((p) => normalizeHex(p) === normalized)
  const sizeClass = swatchSize === 'md' ? 'h-10 w-10' : 'h-9 w-9'

  if (wheelOpen) {
    return (
      <div>
        {label && <p className="mb-1 text-[14px] font-semibold text-ink">{label}</p>}
        <ColorWheelPanel
          initialColor={normalized}
          onBack={() => setWheelOpen(false)}
          onConfirm={(color) => {
            onChange(color)
            setWheelOpen(false)
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {label && <p className="mb-1 text-[14px] font-semibold text-ink">{label}</p>}
      <p className="mb-2.5 text-[13px] text-muted">Soft chalk colours — tap a swatch or open the palette.</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((c) => {
          const preset = normalizeHex(c)
          const active = preset === normalized
          const isChalkTone = preset === CHALK_TONE_PRESET
          const swatch = (
            <button
              type="button"
              onClick={() => onChange(preset)}
              aria-label={isChalkTone ? 'Chalk tone' : `Colour ${preset}`}
              className={cn(
                sizeClass,
                'rounded-full border border-white/70 shadow-[inset_0_2px_5px_rgba(255,255,255,0.55)] transition active:scale-95',
                active ? 'ring-2 ring-ink/25 ring-offset-2 ring-offset-surface' : 'ring-1 ring-black/5',
              )}
              style={{ background: preset }}
            />
          )
          if (!isChalkTone) return <span key={c}>{swatch}</span>
          return (
            <div key={c} className="flex flex-col items-center gap-0.5">
              {swatch}
              <span className="text-[9px] font-semibold leading-none text-muted">Chalk tone</span>
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => setWheelOpen(true)}
          aria-label="Open colour wheel"
          className={cn(
            sizeClass,
            'flex items-center justify-center rounded-full border-2 border-dashed border-[#D4C4B0] bg-[#FFFCF8] transition active:scale-95',
            isCustom && 'ring-2 ring-primary/40 ring-offset-2 ring-offset-surface',
          )}
          style={
            isCustom
              ? {
                  background: normalized,
                  borderStyle: 'solid',
                  borderColor: normalized,
                  boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.55)',
                }
              : undefined
          }
        >
          {!isCustom && <Palette size={swatchSize === 'md' ? 18 : 16} className="text-[#B8956E]" />}
        </button>
      </div>
    </div>
  )
}
