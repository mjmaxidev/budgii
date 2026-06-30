import type { ReactNode } from 'react'

type Props = {
  /** 0..1 (can exceed 1 for over-budget, clamped visually to full + color) */
  progress: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  progress,
  size = 220,
  stroke = 18,
  color = '#16A34A',
  trackColor = '#EFE5DA',
  children,
}: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, progress))
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
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}
