type Props = {
  progress: number
  color?: string
  className?: string
  height?: number
}

export function ProgressBar({ progress, color = '#FF6A00', className, height = 6 }: Props) {
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div
      className={className}
      style={{ height, borderRadius: 999, background: '#EFE5DA', overflow: 'hidden' }}
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  )
}
