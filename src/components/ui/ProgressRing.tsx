import type { ReactNode } from 'react'

export type ProgressRingSegment = { value: number; color: string }

type Props = {
  /** 0..1 (can exceed 1 for over-budget, clamped visually to full + color) */
  progress: number
  /** Optional stacked arcs — each value is a 0..1 fraction of the full ring */
  segments?: ProgressRingSegment[]
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

const SEGMENT_GAP_PX = 2.5
const MIN_SEGMENT_RATIO = 0.012

function mergeSmallSegments(segments: ProgressRingSegment[]): ProgressRingSegment[] {
  if (segments.length <= 1) return segments

  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  if (total <= 0) return segments

  const merged: ProgressRingSegment[] = []
  for (const seg of segments) {
    if (seg.value <= 0) continue
    const ratio = seg.value / total
    const last = merged[merged.length - 1]
    if (last && ratio < MIN_SEGMENT_RATIO) {
      last.value += seg.value
    } else {
      merged.push({ ...seg })
    }
  }

  if (merged.length > 1 && merged[0].value / total < MIN_SEGMENT_RATIO) {
    merged[1].value += merged[0].value
    merged.shift()
  }

  return merged
}

export function ProgressRing({
  progress,
  segments,
  size = 220,
  stroke = 18,
  color = '#16A34A',
  trackColor = '#EFE5DA',
  children,
}: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))

  const preparedSegments =
    segments && segments.length > 0
      ? mergeSmallSegments(segments.filter((seg) => seg.value > 0))
      : []

  let arcCursor = 0
  const segmentArcs =
    preparedSegments.length > 0
      ? (() => {
          const totalValue = preparedSegments.reduce((sum, seg) => sum + seg.value, 0)
          const arcTotal = clamped * circumference
          const gapTotal = preparedSegments.length * SEGMENT_GAP_PX
          const drawable = Math.max(0, arcTotal - gapTotal)

          return preparedSegments.map((seg, i) => {
            const segLen = totalValue > 0 ? (seg.value / totalValue) * drawable : 0
            const offset = arcCursor
            arcCursor += segLen + SEGMENT_GAP_PX

            if (segLen < 0.5) return null

            return (
              <circle
                key={`${seg.color}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                pathLength={circumference}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={-offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
              />
            )
          })
        })()
      : null

  const offset = circumference * (1 - clamped)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {segmentArcs ?? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
