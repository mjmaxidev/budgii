import { createContext, useContext, useRef, useState } from 'react'
import { Eraser, MousePointer2, Pen, Trash2, Undo2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Desktop-only "red pen" review overlay, styled to match the codexUI review studio.
 *
 * `AnnotationProvider` holds the drawing state and renders the full-window drawing
 * surface; `AnnotationToolbar` is the pen/undo/clear cluster that lives in the
 * studio header. Annotations are stored *per page* (keyed by the hash route), so
 * switching pages hides the marks for the page you left — they stay with their
 * original page and don't follow you.
 */

type Point = { x: number; y: number }
type Stroke = { points: Point[] }

const RED = '#EF4444'
const WIDTH = 4

const noDrag = { ['WebkitAppRegion' as never]: 'no-drag' } as React.CSSProperties

function toPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) {
    const p = points[0]
    // a tiny dot so single taps are visible
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`
  }
  return 'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ')
}

type AnnotationApi = {
  enabled: boolean
  setEnabled: (next: boolean) => void
  undo: () => void
  clear: () => void
  clearAll: () => void
  canUndo: boolean
  hasMarks: boolean
  hasAnyMarks: boolean
}

const AnnotationContext = createContext<AnnotationApi | null>(null)

export function useAnnotation(): AnnotationApi {
  const ctx = useContext(AnnotationContext)
  if (!ctx) throw new Error('useAnnotation must be used within <AnnotationProvider>')
  return ctx
}

/**
 * `pageKey` identifies the page the marks belong to — annotations are stored per
 * page and stay with their page when you navigate away. In the QA studio this is
 * the path of the app currently shown in the iframe (the shell tracks it and
 * passes it down), so the overlay no longer reads the window's own hash.
 */
export function AnnotationProvider({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const [strokesByPage, setStrokesByPage] = useState<Record<string, Stroke[]>>({})

  // Live (in-progress) stroke is kept in a ref for accuracy; `tick` forces re-render.
  const liveRef = useRef<Point[]>([])
  const drawingRef = useRef(false)
  const [, setTick] = useState(0)
  const bump = () => setTick((t) => t + 1)

  const page = pageKey
  const strokes = strokesByPage[page] ?? []

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!enabled) return
    drawingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    liveRef.current = [{ x: e.clientX, y: e.clientY }]
    bump()
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || !drawingRef.current) return
    liveRef.current.push({ x: e.clientX, y: e.clientY })
    bump()
  }

  function onPointerUp() {
    if (!drawingRef.current) return
    drawingRef.current = false
    const pts = liveRef.current
    if (pts.length >= 1) {
      const key = page
      setStrokesByPage((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { points: pts }] }))
    }
    liveRef.current = []
    bump()
  }

  const clear = () => setStrokesByPage((prev) => ({ ...prev, [page]: [] }))
  const clearAll = () => setStrokesByPage({})
  const undo = () => setStrokesByPage((prev) => ({ ...prev, [page]: (prev[page] ?? []).slice(0, -1) }))

  const canUndo = strokes.length > 0
  const hasMarks = strokes.length > 0 || liveRef.current.length > 0
  const hasAnyMarks = Object.values(strokesByPage).some((s) => s.length > 0) || liveRef.current.length > 0

  const api: AnnotationApi = { enabled, setEnabled, undo, clear, clearAll, canUndo, hasMarks, hasAnyMarks }

  return (
    <AnnotationContext.Provider value={api}>
      {children}

      {/* Drawing surface — covers the whole window, above the app + modals. */}
      <svg
        className="fixed inset-0 z-[9998]"
        style={{
          width: '100vw',
          height: '100vh',
          pointerEvents: enabled ? 'auto' : 'none',
          cursor: enabled ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {strokes.map((s, i) => (
          <path
            key={i}
            d={toPath(s.points)}
            stroke={RED}
            strokeWidth={WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {drawingRef.current && (
          <path
            d={toPath(liveRef.current)}
            stroke={RED}
            strokeWidth={WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </AnnotationContext.Provider>
  )
}

/** Pen / undo / clear cluster for the studio header — mirrors codexUI's toolbar. */
export function AnnotationToolbar() {
  const { enabled, setEnabled, undo, clear, clearAll, canUndo, hasMarks, hasAnyMarks } = useAnnotation()
  return (
    <div
      className="relative z-[10000] flex items-center gap-1 rounded-full border border-line bg-white p-1 shadow-[0_10px_30px_rgba(17,24,39,0.08)]"
      style={noDrag}
    >
      <ClusterButton label="Scroll / select" active={!enabled} onClick={() => setEnabled(false)}>
        <MousePointer2 className="h-5 w-5" />
      </ClusterButton>
      <ClusterButton label="Red pen" active={enabled} onClick={() => setEnabled(true)}>
        <Pen className="h-5 w-5" />
      </ClusterButton>
      <ClusterButton label="Undo" onClick={undo} disabled={!canUndo}>
        <Undo2 className="h-5 w-5" />
      </ClusterButton>
      <ClusterButton label="Clear this page" onClick={clear} disabled={!hasMarks}>
        <Eraser className="h-5 w-5" />
      </ClusterButton>
      <ClusterButton label="Clear all pages" onClick={clearAll} disabled={!hasAnyMarks}>
        <Trash2 className="h-5 w-5" />
      </ClusterButton>
    </div>
  )
}

function ClusterButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-grid h-10 w-10 place-items-center rounded-full transition active:scale-95 disabled:opacity-40',
        active ? 'bg-primary text-white shadow-soft' : 'text-ink hover:bg-black/5',
      )}
    >
      {children}
    </button>
  )
}
