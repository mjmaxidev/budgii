import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors, fontFamily } from '../theme'

const categories = [
  { name: 'Groceries', icon: '🛒', color: colors.green, amount: '$84', pct: 54 },
  { name: 'Dining', icon: '🍽️', color: '#FB8500', amount: '$42', pct: 27 },
  { name: 'Transport', icon: '🚗', color: colors.blue, amount: '$29', pct: 19 },
]

export const HomeMockup: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const ringProgress = spring({ frame: frame - 8, fps, config: { damping: 20 } })
  const spent = Math.round(interpolate(ringProgress, [0, 1], [0, 155]))
  const circumference = 2 * Math.PI * 78
  const dash = circumference * interpolate(ringProgress, [0, 1], [0, 0.078])

  return (
    <div style={{ fontFamily, height: '100%', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 22 }}>🔭</span>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: colors.ink }}>
          Hello, <strong>Alex</strong>
        </p>
        <span style={{ fontSize: 22 }}>🔔</span>
      </div>

      <p style={{ margin: '12px 16px 0', fontSize: 19, fontWeight: 800, color: colors.ink }}>
        This Month Overview
      </p>

      <div
        style={{
          margin: '12px 16px 0',
          display: 'flex',
          background: colors.surface,
          borderRadius: 14,
          padding: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {['Daily', 'Weekly', 'Monthly'].map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 0',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: i === 2 ? colors.primary : 'transparent',
              color: i === 2 ? '#fff' : colors.muted,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          margin: '14px 16px 0',
          background: colors.surface,
          borderRadius: 18,
          padding: 14,
          boxShadow: '0 4px 16px rgba(255,106,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>Budget Progress</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: colors.green }}>7.8%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: '#F3F4F6', overflow: 'hidden' }}>
          <div style={{ width: '7.8%', height: '100%', background: colors.green, borderRadius: 99 }} />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: colors.muted }}>$155 of $2,000</p>
      </div>

      <div style={{ margin: '20px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width={170} height={170} viewBox="0 0 180 180">
          <circle cx={90} cy={90} r={78} fill="none" stroke="#F3F4F6" strokeWidth={14} />
          <circle
            cx={90}
            cy={90}
            r={78}
            fill="none"
            stroke={colors.green}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 90 90)"
          />
          <text x={90} y={82} textAnchor="middle" fontSize={13} fill={colors.muted}>
            Spent
          </text>
          <text x={90} y={108} textAnchor="middle" fontSize={28} fontWeight={800} fill={colors.ink}>
            ${spent}
          </text>
        </svg>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>Remaining</p>
          <p style={{ margin: '4px 0', fontSize: 28, fontWeight: 900, color: colors.green }}>$1,845</p>
          <p style={{ margin: 0, fontSize: 12, color: colors.muted }}>Left to spend</p>
        </div>
      </div>

      <div style={{ margin: '16px 16px 0', display: 'flex', gap: 10, overflow: 'hidden' }}>
        {categories.map((cat, i) => {
          const cardEnter = spring({ frame: frame - 18 - i * 5, fps, config: { damping: 16 } })
          return (
            <div
              key={cat.name}
              style={{
                width: 100,
                flexShrink: 0,
                background: colors.surface,
                borderRadius: 16,
                padding: 12,
                textAlign: 'center',
                transform: `translateY(${interpolate(cardEnter, [0, 1], [24, 0])}px)`,
                opacity: cardEnter,
              }}
            >
              <div style={{ fontSize: 28 }}>{cat.icon}</div>
              <p style={{ margin: '6px 0 2px', fontSize: 12, fontWeight: 600, color: colors.muted }}>{cat.name}</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.ink }}>{cat.amount}</p>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${colors.line}`,
          background: 'rgba(255,255,255,0.95)',
          padding: '8px 16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {['🏠', '📋', '', '📊', '⚙️'].map((icon, i) => (
          <div key={i} style={{ width: 56, textAlign: 'center' }}>
            {i === 2 ? (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 99,
                  background: colors.primary,
                  color: '#fff',
                  fontSize: 28,
                  lineHeight: '52px',
                  margin: '-20px auto 0',
                  boxShadow: '0 8px 20px rgba(255,106,0,0.35)',
                }}
              >
                +
              </div>
            ) : (
              <span style={{ fontSize: 22, color: i === 0 ? colors.primary : colors.muted }}>{icon}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
