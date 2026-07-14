import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { PhoneFrame } from './components/PhoneFrame'
import { FamilyMockup } from './mockups/FamilyMockup'
import { HomeMockup } from './mockups/HomeMockup'
import { ScanReceiptMockup } from './mockups/ScanReceiptMockup'
import { colors, fontFamily } from './theme'

const WarmBackground: React.FC = () => {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 40) * 20

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${colors.bg} 0%, #ffe8d2 50%, #ffd9b8 100%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: colors.primary,
          opacity: 0.18,
          filter: 'blur(90px)',
          top: -120 + drift,
          right: -80,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: colors.green,
          opacity: 0.12,
          filter: 'blur(80px)',
          bottom: -100 - drift,
          left: -60,
        }}
      />
    </AbsoluteFill>
  )
}

const FeatureLabel: React.FC<{ title: string; subtitle: string; enterAt?: number }> = ({
  title,
  subtitle,
  enterAt = 0,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - enterAt, fps, config: { damping: 18 } })

  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 180,
        maxWidth: 520,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
        fontFamily,
      }}
    >
      <p style={{ margin: 0, fontSize: 56, fontWeight: 900, lineHeight: 1.05, color: colors.ink }}>{title}</p>
      <p style={{ margin: '16px 0 0', fontSize: 26, lineHeight: 1.4, color: colors.muted, fontWeight: 500 }}>
        {subtitle}
      </p>
    </div>
  )
}

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const introLogo = spring({ frame, fps, config: { damping: 16 } })
  const introTag = spring({ frame: frame - 12, fps, config: { damping: 18 } })
  const introOut = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: introOut }}>
      <Img
        src={staticFile('budgii-logo.png')}
        style={{
          width: 420,
          transform: `scale(${interpolate(introLogo, [0, 1], [0.85, 1])})`,
          opacity: introLogo,
        }}
      />
      <p
        style={{
          marginTop: 28,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#0d6832',
          opacity: introTag,
        }}
      >
        Smart Budgets. Better Futures.
      </p>
    </AbsoluteFill>
  )
}

const FamilyHookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hookEnter = spring({ frame: frame - 5, fps, config: { damping: 16 } })
  const hookOut = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: hookOut }}>
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 220,
          maxWidth: 700,
          opacity: hookEnter,
          transform: `translateY(${interpolate(hookEnter, [0, 1], [40, 0])}px)`,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 82, fontWeight: 900, lineHeight: 1.05, color: colors.ink }}>
          Budget together,
          <br />
          <span style={{ color: '#c2410c' }}>as a family</span>
        </h1>
        <p style={{ marginTop: 24, fontSize: 28, color: colors.muted, maxWidth: 560, lineHeight: 1.45 }}>
          One household. Shared goals. Everyone knows where the money goes.
        </p>
      </div>
      <div style={{ position: 'absolute', right: 140, top: 110 }}>
        <PhoneFrame enterAt={15}>
          <HomeMockup />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  )
}

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const ctaEnter = spring({ frame: frame - 8, fps, config: { damping: 14 } })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          textAlign: 'center',
          marginBottom: 48,
          opacity: ctaEnter,
          transform: `translateY(${interpolate(ctaEnter, [0, 1], [24, 0])}px)`,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 72, fontWeight: 900, color: colors.ink }}>Start budgeting together</h2>
        <p style={{ margin: '16px 0 0', fontSize: 30, color: colors.muted }}>budgii.com.au</p>
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
        <div style={{ transform: 'translateY(30px) scale(0.88)', opacity: 0.92 }}>
          <PhoneFrame enterAt={20} float={false}>
            <FamilyMockup />
          </PhoneFrame>
        </div>
        <PhoneFrame enterAt={12} float={false}>
          <HomeMockup />
        </PhoneFrame>
        <div style={{ transform: 'translateY(30px) scale(0.88)', opacity: 0.92 }}>
          <PhoneFrame enterAt={26} float={false}>
            <ScanReceiptMockup />
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const BudgiiPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <WarmBackground />

      <Sequence from={0} durationInFrames={95}>
        <IntroScene />
      </Sequence>

      <Sequence from={90} durationInFrames={125}>
        <FamilyHookScene />
      </Sequence>

      <Sequence from={210} durationInFrames={250}>
        <AbsoluteFill>
          <FeatureLabel
            enterAt={8}
            title="See your spending at a glance"
            subtitle="Monthly budgets, category breakdowns, and what's left — all in one warm, simple home screen."
          />
          <div style={{ position: 'absolute', right: 100, top: 90 }}>
            <PhoneFrame enterAt={12} float>
              <HomeMockup />
            </PhoneFrame>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={460} durationInFrames={210}>
        <AbsoluteFill>
          <FeatureLabel
            enterAt={8}
            title="Invite the whole household"
            subtitle="Assign roles, tag expenses by family member, and keep everyone on the same page."
          />
          <div style={{ position: 'absolute', right: 100, top: 90 }}>
            <PhoneFrame enterAt={12} float>
              <FamilyMockup />
            </PhoneFrame>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={670} durationInFrames={210}>
        <AbsoluteFill>
          <FeatureLabel
            enterAt={8}
            title="Scan receipts in seconds"
            subtitle="Snap a grocery run or bill — Budgii reads the total and files it for you."
          />
          <div style={{ position: 'absolute', right: 100, top: 90 }}>
            <PhoneFrame enterAt={12} float>
              <ScanReceiptMockup />
            </PhoneFrame>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={880} durationInFrames={470}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  )
}
