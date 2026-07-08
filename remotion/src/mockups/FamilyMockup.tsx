import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors, fontFamily } from '../theme'

const members = [
  { name: 'Alex', rel: 'You', avatar: '🧑', role: 'Admin' },
  { name: 'Sam', rel: 'Partner', avatar: '👩', role: 'Editor' },
  { name: 'Mia', rel: 'Child', avatar: '🧒', role: 'Viewer' },
  { name: 'Max', rel: 'Child', avatar: '👦', role: 'Viewer' },
]

export const FamilyMockup: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div style={{ fontFamily, height: '100%', background: colors.bg }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>←</span>
        <p style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: colors.ink }}>
          Family Members
        </p>
        <span style={{ width: 22 }} />
      </div>

      <div
        style={{
          margin: '12px 16px',
          padding: '14px 16px',
          borderRadius: 16,
          background: colors.primarySoft,
          border: `1px solid rgba(255,106,0,0.2)`,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.primary }}>
          Invite family to your household
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: colors.muted, lineHeight: 1.4 }}>
          Share budgets, tag expenses, and stay aligned together.
        </p>
      </div>

      {members.map((m, i) => {
        const enter = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 16 } })
        return (
          <div
            key={m.name}
            style={{
              margin: '0 16px 10px',
              padding: '14px 16px',
              borderRadius: 18,
              background: colors.surface,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              transform: `translateX(${interpolate(enter, [0, 1], [40, 0])}px)`,
              opacity: enter,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 99,
                background: colors.primarySoft,
                display: 'grid',
                placeItems: 'center',
                fontSize: 26,
              }}
            >
              {m.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.ink }}>{m.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.muted }}>{m.rel}</p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: 99,
                background: m.role === 'Admin' ? colors.ink : colors.primarySoft,
                color: m.role === 'Admin' ? '#fff' : colors.primary,
              }}
            >
              {m.role}
            </span>
          </div>
        )
      })}
    </div>
  )
}
