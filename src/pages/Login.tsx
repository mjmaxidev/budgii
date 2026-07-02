import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Apple } from 'lucide-react'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'

export function Login() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  function go() {
    navigate('/home')
  }

  return (
    <div className="no-scrollbar mx-auto flex h-full w-full max-w-[390px] flex-col overflow-y-auto bg-bg px-6 pb-8 pt-12">
      {/* Brand logo */}
      <div className="mb-8 flex justify-center">
        <img
          src="/budgii-logo.png"
          alt="Budgii — Smart Budgets. Better Futures."
          className="h-20 object-contain"
        />
      </div>

      <h1 className="text-[34px] font-extrabold leading-tight text-ink">
        Track Smarter<br />
        <span className="text-primary">Spending</span>
      </h1>
      <p className="mt-3 text-[16px] leading-snug text-muted">
        Take control of your money and build a better financial future.
      </p>

      <div className="mt-7 space-y-3">
        <FormField type="email" placeholder="Email address" leftIcon={<Mail size={20} />} defaultValue="dev@mjproductions.app" />
        <FormField
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          leftIcon={<Lock size={20} />}
          defaultValue="password"
          rightSlot={
            <button onClick={() => setShowPw((v) => !v)} className="text-muted" type="button">
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
      </div>

      <div className="mt-5 space-y-3">
        <ActionButton onClick={go}>Log In</ActionButton>
        <ActionButton variant="outline" onClick={() => navigate('/onboarding')}>
          Create Account
        </ActionButton>
        <button
          type="button"
          onClick={() => navigate('/join-family')}
          className="w-full py-2 text-center text-[14px] font-semibold text-primary active:opacity-80"
        >
          Have an invite code?
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
        <span className="h-px flex-1 bg-line" />
        or continue with
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-3">
        <button
          onClick={go}
          className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-input border border-line bg-surface text-[16px] font-bold text-ink active:bg-surfaceSoft"
        >
          <Apple size={20} fill="currentColor" /> Continue with Apple
        </button>
        <button
          onClick={go}
          className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-input border border-line bg-surface text-[16px] font-bold text-ink active:bg-surfaceSoft"
        >
          <span className="text-[18px] font-extrabold text-[#4285F4]">G</span> Continue with Google
        </button>
      </div>
    </div>
  )
}
