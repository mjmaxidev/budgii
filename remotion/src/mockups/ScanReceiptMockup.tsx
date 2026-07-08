import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors, fontFamily } from '../theme'

export const ScanReceiptMockup: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scanLine = interpolate(frame % 60, [0, 60], [80, 320])
  const pulse = spring({ frame: frame - 20, fps, config: { damping: 14 } })

  return (
    <div style={{ fontFamily, height: '100%', background: colors.bg }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>←</span>
        <p style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: colors.ink }}>
          Scan Receipt
        </p>
        <span style={{ fontSize: 18 }}>ℹ️</span>
      </div>

      <p style={{ margin: '8px 16px 0', textAlign: 'center', fontSize: 15, color: colors.muted, lineHeight: 1.45 }}>
        Capture or upload your receipt and let AI do the rest.
      </p>

      <div
        style={{
          margin: '24px auto 0',
          width: 280,
          height: 360,
          position: 'relative',
          borderRadius: 20,
        }}
      >
        {['tl', 'tr', 'bl', 'br'].map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: 36,
              height: 36,
              borderColor: colors.primary,
              borderStyle: 'solid',
              borderWidth: 0,
              ...(corner === 'tl' && { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: '12px 0 0 0' }),
              ...(corner === 'tr' && { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderRadius: '0 12px 0 0' }),
              ...(corner === 'bl' && { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: '0 0 0 12px' }),
              ...(corner === 'br' && { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: '0 0 12px 0' }),
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            inset: 16,
            borderRadius: 16,
            background: '#FAF6F0',
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 11,
            color: 'rgba(17,24,39,0.75)',
            overflow: 'hidden',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>COLES SUPERMARKET</p>
          <p style={{ margin: '8px 0' }}>Milk .............. $4.50</p>
          <p style={{ margin: '4px 0' }}>Bread ............. $3.20</p>
          <p style={{ margin: '4px 0' }}>Apples ............ $6.80</p>
          <p style={{ margin: '4px 0' }}>Chicken ........... $12.40</p>
          <p style={{ margin: '12px 0 0', fontWeight: 700 }}>TOTAL AUD $84.50</p>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanLine,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              boxShadow: `0 0 16px ${colors.primary}`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          margin: '28px 16px 0',
          padding: 16,
          borderRadius: 18,
          background: colors.surface,
          opacity: pulse,
          transform: `scale(${interpolate(pulse, [0, 1], [0.95, 1])})`,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.green }}>✓ Items detected</p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: colors.muted }}>Groceries · $84.50 · Tagged to Alex</p>
      </div>
    </div>
  )
}
