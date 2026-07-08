import type { CSSProperties, ReactNode } from 'react'
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../theme'

type Props = {
  children: ReactNode
  enterAt?: number
  float?: boolean
  style?: CSSProperties
}

export const PhoneFrame: React.FC<Props> = ({
  children,
  enterAt = 0,
  float = true,
  style,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enter = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 18, stiffness: 90 },
  })

  const y = float
    ? interpolate(Math.sin((frame - enterAt) / 35), [-1, 1], [8, -8])
    : 0

  const scale = interpolate(enter, [0, 1], [0.82, 1])
  const opacity = interpolate(enter, [0, 1], [0, 1])

  return (
    <div
      style={{
        width: 390,
        height: 844,
        borderRadius: 44,
        border: `10px solid ${colors.ink}`,
        background: colors.bg,
        boxShadow: '0 32px 90px rgba(17,24,39,0.28)',
        overflow: 'hidden',
        position: 'relative',
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 28,
          borderRadius: 20,
          background: colors.ink,
          zIndex: 20,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, paddingTop: 36 }}>{children}</div>
    </div>
  )
}
