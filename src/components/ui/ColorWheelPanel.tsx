import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { ActionButton } from '@/components/ui/ActionButton'
import { CHALK_LIGHTNESS_DEFAULT, CHALK_LIGHTNESS_MAX, CHALK_LIGHTNESS_MIN } from '@/constants/chalkColors'
import {
  drawColorWheel,
  hexToHsl,
  hslMarkerPosition,
  hslToHex,
  normalizeHex,
  pickColorFromWheel,
  toChalkTone,
} from '@/utils/color'

const WHEEL_SIZE = 200

type Props = {
  initialColor: string
  onConfirm: (color: string) => void
  onBack: () => void
}

export function ColorWheelPanel({ initialColor, onConfirm, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)
  const start = normalizeHex(initialColor)
  const startHsl = hexToHsl(/^#[0-9A-F]{6}$/i.test(start) ? start : '#E5A97A')

  const [lightness, setLightness] = useState(
    Math.min(CHALK_LIGHTNESS_MAX, Math.max(CHALK_LIGHTNESS_MIN, startHsl.l || CHALK_LIGHTNESS_DEFAULT)),
  )
  const [hue, setHue] = useState(startHsl.h)
  const [saturation, setSaturation] = useState(Math.max(startHsl.s, 10))
  const draftColor = toChalkTone(hslToHex(hue, saturation, lightness))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawColorWheel(canvas, lightness)
  }, [lightness])

  const marker = hslMarkerPosition(hue, saturation, WHEEL_SIZE)

  function applyPick(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const picked = pickColorFromWheel(clientX, clientY, canvas, lightness)
    if (!picked) return
    const hsl = hexToHsl(picked)
    setHue(hsl.h)
    setSaturation(Math.max(hsl.s, 8))
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    applyPick(e.clientX, e.clientY)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragging.current) return
    applyPick(e.clientX, e.clientY)
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div className="mt-3 space-y-4 rounded-card border border-line/60 bg-[#FFFCF8] p-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary"
      >
        <ChevronLeft size={18} /> Back to presets
      </button>

      <p className="text-[14px] leading-snug text-muted">
        Drag on the wheel for a soft chalk colour. Centre is lighter; edge is richer.
      </p>

      <div className="relative mx-auto h-[200px] w-[200px] rounded-full bg-[#F5EFE6] p-2 shadow-inner">
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          className="h-full w-full touch-none rounded-full"
          aria-label="Chalk colour wheel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white shadow-md ring-1 ring-black/10"
          style={{
            left: `${(marker.x / WHEEL_SIZE) * 100}%`,
            top: `${(marker.y / WHEEL_SIZE) * 100}%`,
            background: draftColor,
          }}
        />
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-ink">
          <span>Contrast</span>
          <span className="text-muted">{Math.round(lightness)}%</span>
        </span>
        <input
          type="range"
          min={CHALK_LIGHTNESS_MIN}
          max={CHALK_LIGHTNESS_MAX}
          value={lightness}
          onChange={(e) => setLightness(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#EDE4D8] accent-[#C9956C]"
        />
      </label>

      <div className="flex items-center gap-3 rounded-card bg-surface px-3 py-2.5 shadow-card">
        <span
          className="h-10 w-10 shrink-0 rounded-full border border-line/50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.65)]"
          style={{ background: draftColor }}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">Preview</p>
          <p className="font-mono text-[12px] text-muted">{draftColor}</p>
        </div>
      </div>

      <ActionButton variant="green" onClick={() => onConfirm(draftColor)} leftIcon={<Check size={18} />}>
        Add Colour
      </ActionButton>
    </div>
  )
}
