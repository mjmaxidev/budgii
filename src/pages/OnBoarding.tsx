import { useRef, useState, useEffect, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check,
  Mail, User, Users,
  Shield,
  PieChart, Receipt, Camera,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { withFrom } from '@/utils/navigation'
import { useStore } from '@/store/appStore'

type Step = 1 | 2 | 3 | 4
type ContactMethod = 'phone' | 'email' | 'apple' | 'google'
type ManagingFor = 'individual' | 'household'

// ─────────────────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────────────────

// Cropped onboarding illustrations live in /assets/onboarding/. Until a file
// exists the <img> is simply hidden, so the layout stays intact.
function Illustration({ name, className, alt = '' }: { name: string; className?: string; alt?: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return <div className={className} aria-hidden />
  return (
    <img
      src={`/assets/onboarding/${name}.png`}
      alt={alt}
      className={cn('object-contain', className)}
      onError={() => setOk(false)}
    />
  )
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center px-2">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1
        const filled = n <= step
        return (
          <div key={n} className={cn('flex items-center', i < total - 1 && 'flex-1')}>
            <div className={cn(
              'h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors',
              filled ? 'border-primary bg-primary' : 'border-line bg-surface',
            )} />
            {i < total - 1 && (
              <div className={cn('h-0.5 flex-1 transition-colors', n < step ? 'bg-primary' : 'bg-line')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CompactHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  return (
    <div className="px-5 pt-5 pb-3">
      <div className="flex items-center">
        {onBack ? (
          <button onClick={onBack} className="-ml-1 p-1">
            <ChevronLeft size={24} className="text-ink" />
          </button>
        ) : (
          <div className="w-8" />
        )}
        <p className="flex-1 text-center text-[11px] font-bold uppercase tracking-widest text-primary">
          Step {step} of {total}
        </p>
        <div className="w-8" />
      </div>
      <div className="mt-4">
        <ProgressDots step={step} total={total} />
      </div>
    </div>
  )
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(e: ChangeEvent<HTMLInputElement>, idx: number) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.padEnd(6, ' ').split('')
    arr[idx] = char || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (char && idx < 5) refs.current[idx + 1]?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = value.padEnd(6, ' ').split('')
      if (arr[idx].trim()) {
        arr[idx] = ' '
        onChange(arr.join('').trimEnd())
      } else if (idx > 0) {
        arr[idx - 1] = ' '
        onChange(arr.join('').trimEnd())
        refs.current[idx - 1]?.focus()
      }
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      refs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => {
        const digit = value[idx]?.trim() ?? ''
        return (
          <input
            key={idx}
            ref={el => { refs.current[idx] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e, idx)}
            onKeyDown={e => handleKeyDown(e, idx)}
            onFocus={e => e.target.select()}
            className={cn(
              'h-14 w-11 rounded-xl border-2 bg-white text-center text-xl font-bold text-ink outline-none transition-colors',
              digit ? 'border-primary' : 'border-line',
            )}
          />
        )
      })}
    </div>
  )
}

function ResendTimer({ onResend }: { onResend: () => void }) {
  const [secs, setSecs] = useState(30)
  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [secs])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <p className="text-center text-sm text-muted">
      Didn't receive a code?{' '}
      {secs > 0 ? (
        <span className="font-semibold text-primary">Resend in {mm}:{ss}</span>
      ) : (
        <button onClick={() => { setSecs(30); onResend() }} className="font-semibold text-primary">
          Resend now
        </button>
      )}
    </p>
  )
}

// Apple + Google logo SVGs
function AppleLogo() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" className="text-ink">
      <path d="M13.174 10.752c-.022-2.184 1.784-3.233 1.863-3.283-1.015-1.484-2.594-1.687-3.154-1.706-1.337-.136-2.617.79-3.296.79-.68 0-1.717-.773-2.82-.752-1.441.022-2.775.84-3.519 2.128C.764 10.485 1.82 15.27 3.384 17.876c.777 1.283 1.698 2.718 2.9 2.67 1.168-.046 1.608-.748 3.02-.748 1.41 0 1.817.748 3.056.725 1.26-.02 2.054-1.303 2.822-2.592a10.9 10.9 0 0 0 1.28-2.995c-.03-.013-2.313-.887-2.288-3.184ZM10.896 3.9c.634-.774 1.064-1.845.947-2.918-.914.038-2.042.614-2.697 1.37C8.52 3.08 8 4.19 8.099 5.24c1.026.08 2.077-.516 2.797-1.34Z" />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function OnBoarding() {
  const addFamilyMember = useStore(s => s.addFamilyMember)
  const triggerPinSetupPrompt = useStore(s => s.triggerPinSetupPrompt)
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [otp, setOtp] = useState('')
  const [managingFor, setManagingFor] = useState<ManagingFor>('household')
  const [name, setName] = useState('')

  function goToVerify(method: ContactMethod, value: string) {
    setContactMethod(method)
    setContact(value)
    setOtp('')
    setStep(2)
  }

  function completeProfile() {
    if (name.trim()) {
      addFamilyMember({
        name: name.trim(),
        relationship: 'You',
        avatar: '👤',
        isDefault: true,
        isAccountHolder: true,
        hasAppAccess: true,
        accessRole: 'admin',
      })
    }
    setStep(4)
  }

  if (step === 1) {
    return (
      <Step1CreateAccount
        contact={contact}
        setContact={setContact}
        onContinue={(c) => {
          const isPhone = /^[+\d\s()-]{4,}$/.test(c)
          goToVerify(isPhone ? 'phone' : 'email', c)
        }}
        onSocial={(method) => goToVerify(method, method === 'apple' ? 'your Apple account' : 'your Google account')}
        onLogin={() => navigate('/login')}
      />
    )
  }

  if (step === 2) {
    return (
      <Step2Verify
        contactMethod={contactMethod}
        contact={contact}
        otp={otp}
        setOtp={setOtp}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
        onChangeContact={() => setStep(1)}
      />
    )
  }

  if (step === 3) {
    return (
      <Step3AboutYou
        managingFor={managingFor}
        setManagingFor={setManagingFor}
        name={name}
        setName={setName}
        onBack={() => setStep(2)}
        onContinue={completeProfile}
      />
    )
  }

  return (
    <Step4Welcome
      name={name}
      onBack={() => setStep(3)}
      onAction={(action) => {
        triggerPinSetupPrompt()
        const routes: Record<string, string> = {
          budget: '/budget-setup',
          expense: '/add-expense',
          receipt: '/scan-receipt',
          family: '/family-members',
          explore: '/home',
        }
        const target = routes[action] ?? '/home'
        navigate(target, action === 'budget' ? withFrom('/home') : undefined)
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Create your account
// ─────────────────────────────────────────────────────────────────────────────

function Step1CreateAccount({
  contact, setContact, onContinue, onSocial, onLogin,
}: {
  contact: string
  setContact: (v: string) => void
  onContinue: (c: string) => void
  onSocial: (m: 'apple' | 'google') => void
  onLogin: () => void
}) {
  const canContinue = contact.trim().length >= 4

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg px-6 pt-6 pb-8">
      {/* Header: back + step label */}
      <div className="flex items-center">
        <button onClick={onLogin} className="-ml-1 p-1">
          <ChevronLeft size={24} className="text-ink" />
        </button>
        <p className="flex-1 text-center text-[12px] font-bold uppercase tracking-widest text-primary">
          Step 1 of 4
        </p>
        <div className="w-8" />
      </div>

      {/* Logo wordmark */}
      <div className="mt-4 flex justify-center">
        <Illustration name="wordmark" className="h-12" alt="Budgii" />
      </div>

      {/* Hero illustration */}
      <div className="mt-3 flex justify-center">
        <Illustration name="wallet" className="h-40" alt="" />
      </div>

      {/* Title */}
      <h1 className="mt-4 text-center text-[28px] font-extrabold leading-tight" style={{ color: '#1A3B2E' }}>
        Create your account
      </h1>
      <p className="mx-auto mt-1.5 max-w-[260px] text-center text-[15px] text-muted">
        Let's get started with your Budgii journey.
      </p>

      {/* Input */}
      <div className="mt-7 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm">
        <Mail size={20} className="shrink-0 text-muted" />
        <input
          type="text"
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Email address or phone number"
          className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </div>

      {/* Continue */}
      <button
        onClick={() => onContinue(contact)}
        disabled={!canContinue}
        className={cn(
          'mt-4 w-full rounded-2xl py-4 text-center text-[16px] font-bold text-white transition',
          canContinue ? 'bg-primary active:bg-primary/90' : 'bg-primary/40',
        )}
      >
        Continue
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-sm font-medium text-muted">or continue with</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* Google */}
      <button
        onClick={() => onSocial('google')}
        className="mb-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface py-4 shadow-sm active:bg-surfaceSoft"
      >
        <GoogleLogo />
        <span className="text-[15px] font-bold text-ink">Continue with Google</span>
      </button>

      {/* Apple */}
      <button
        onClick={() => onSocial('apple')}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface py-4 shadow-sm active:bg-surfaceSoft"
      >
        <AppleLogo />
        <span className="text-[15px] font-bold text-ink">Continue with Apple</span>
      </button>

      {/* Log in */}
      <p className="mt-6 text-center text-[15px] text-muted">
        Already have an account?{' '}
        <button onClick={onLogin} className="font-bold text-primary">
          Log in
        </button>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Verify (phone or email)
// ─────────────────────────────────────────────────────────────────────────────

function Step2Verify({
  contactMethod, contact, otp, setOtp, onBack, onContinue, onChangeContact,
}: {
  contactMethod: ContactMethod
  contact: string
  otp: string
  setOtp: (v: string) => void
  onBack: () => void
  onContinue: () => void
  onChangeContact: () => void
}) {
  const isPhone = contactMethod === 'phone'
  const otpComplete = otp.replace(/\s/g, '').length === 6
  const [resent, setResent] = useState(false)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg">
      <CompactHeader step={2} total={4} onBack={onBack} />

      <div className="flex flex-1 flex-col px-5 pt-2 pb-6">
        {/* Illustration */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-6 flex h-44 items-center justify-center">
            <Illustration name={isPhone ? 'phone' : 'envelope'} className="h-44" alt="" />
          </div>

          <h1 className="text-center text-[28px] font-extrabold" style={{ color: '#1A3B2E' }}>
            {isPhone ? 'Check your phone' : 'Check your email'}
          </h1>
          <p className="mt-2 text-center text-[15px] text-muted">
            We sent a 6-digit verification code to
          </p>
          <p className="mt-0.5 text-center text-[15px] font-bold text-ink">{contact}</p>

          {/* OTP */}
          <div className="mt-8 w-full">
            <OTPInput value={otp} onChange={setOtp} />
          </div>

          {/* Security notice (email only) */}
          {!isPhone && (
            <div className="mt-5 flex w-full items-center gap-3 rounded-xl bg-green-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Shield size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-green-900">Keep your code safe</p>
                <p className="text-[12px] text-green-700">Never share your code with anyone. Budgii will never ask for it.</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="mt-4 space-y-3">
          <button
            onClick={onContinue}
            disabled={!otpComplete}
            className={cn(
              'w-full rounded-2xl py-4 text-center text-[15px] font-bold text-white transition',
              otpComplete ? 'bg-primary active:bg-primary/90' : 'bg-primary/40',
            )}
          >
            Verify and continue
          </button>

          <ResendTimer
            onResend={() => {
              setResent(true)
              setTimeout(() => setResent(false), 3000)
            }}
          />
          {resent && (
            <p className="text-center text-[13px] font-semibold text-green">
              A new code was sent to {contact}
            </p>
          )}

          <div className="flex justify-center">
            <button onClick={onChangeContact} className="text-[14px] font-semibold" style={{ color: '#1A3B2E' }}>
              Change {isPhone ? 'phone number' : 'email address'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Tell us about you
// ─────────────────────────────────────────────────────────────────────────────

function Step3AboutYou({
  managingFor, setManagingFor, name, setName, onBack, onContinue,
}: {
  managingFor: ManagingFor
  setManagingFor: (v: ManagingFor) => void
  name: string
  setName: (v: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const canContinue = name.trim().length > 0

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[390px] flex-col bg-bg">
      <CompactHeader step={3} total={4} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {/* Illustration */}
        <div className="flex h-40 items-center justify-center">
          <Illustration name="about" className="h-40" alt="" />
        </div>

        <h1 className="text-center text-[28px] font-extrabold" style={{ color: '#1A3B2E' }}>Tell us about you</h1>
        <p className="mt-1.5 text-center text-[15px] text-muted">Help us personalise your Budgii experience.</p>

        {/* Managing for */}
        <div className="mt-6">
          <p className="mb-3 text-[15px] font-bold text-ink">Who are you managing for?</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'individual' as ManagingFor, img: 'individual', label: "I'm managing just for me", sub: 'Individual' },
              { value: 'household' as ManagingFor, img: 'family', label: "I'm managing for my household", sub: 'Family / Household' },
            ].map(opt => {
              const selected = managingFor === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setManagingFor(opt.value)}
                  className={cn(
                    'relative flex flex-col items-center rounded-2xl border-2 px-3 py-4 text-center transition',
                    selected ? 'border-primary bg-primarySoft' : 'border-line bg-surface',
                  )}
                >
                  <div className={cn(
                    'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2',
                    selected ? 'border-primary bg-primary' : 'border-line bg-surface',
                  )}>
                    {selected && <Check size={14} className="text-white" />}
                  </div>
                  <div className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-green-50">
                    <Illustration name={opt.img} className="h-20 w-20" alt="" />
                  </div>
                  <p className="text-[13px] font-bold leading-tight text-ink">{opt.label}</p>
                  <p className={cn('mt-1 text-[12px] font-semibold', selected ? 'text-primary' : 'text-muted')}>{opt.sub}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Name */}
        <div className="mt-5">
          <p className="mb-2 text-[15px] font-bold text-ink">What should we call you?</p>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
            <User size={18} className="shrink-0 text-muted" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-line bg-surface px-5 py-4">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={cn(
            'w-full rounded-2xl py-4 text-center text-[15px] font-bold text-white transition',
            canContinue ? 'bg-primary active:bg-primary/90' : 'bg-primary/40',
          )}
        >
          Continue
        </button>
        <button onClick={onBack} className="mt-3 w-full py-1 text-center text-[15px] font-semibold text-muted">
          Back
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Welcome
// ─────────────────────────────────────────────────────────────────────────────

function Step4Welcome({ name, onBack, onAction }: { name: string; onBack: () => void; onAction: (action: string) => void }) {
  const ACTIONS = [
    {
      key: 'budget',
      icon: <PieChart size={22} className="text-white" />,
      iconBg: 'bg-primary',
      label: 'Set Up My Budget',
      desc: 'Create a monthly budget and track your progress.',
    },
    {
      key: 'expense',
      icon: <Receipt size={22} className="text-white" />,
      iconBg: 'bg-[#1A5E3A]',
      label: 'Add My First Expense',
      desc: 'Start tracking a purchase or payment.',
    },
    {
      key: 'receipt',
      icon: <Camera size={22} className="text-white" />,
      iconBg: 'bg-[#D97706]',
      label: 'Scan a Receipt',
      desc: 'Upload a receipt and let Budgii do the rest.',
    },
    {
      key: 'family',
      icon: <Users size={22} className="text-white" />,
      iconBg: 'bg-[#3D7A5A]',
      label: 'Add Family Members',
      desc: 'Track spending together with your family.',
    },
  ]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-bg">
      <CompactHeader step={4} total={4} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Illustration */}
        <div className="flex h-44 items-center justify-center">
          <Illustration name="bag" className="h-44" alt="" />
        </div>

        {/* Welcome message */}
        <h1 className="text-center text-[28px] font-extrabold leading-tight" style={{ color: '#1A3B2E' }}>
          Welcome to Budgii{name.trim() ? `, ${name.trim()}` : ''}! 🎉
        </h1>
        <p className="mt-2 text-center text-[15px] text-muted">What would you like to start with?</p>

        {/* Action cards */}
        <div className="mt-6 space-y-3">
          {ACTIONS.map(a => (
            <button
              key={a.key}
              onClick={() => onAction(a.key)}
              className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-4 text-left active:bg-surfaceSoft"
            >
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', a.iconBg)}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">{a.label}</p>
                <p className="text-[13px] text-muted">{a.desc}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>

        {/* Explore link */}
        <button
          onClick={() => onAction('explore')}
          className="mt-6 w-full text-center text-[15px] font-bold"
          style={{ color: '#1A3B2E' }}
        >
          Explore the app first
        </button>
      </div>
    </div>
  )
}
