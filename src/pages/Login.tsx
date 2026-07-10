import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Apple } from 'lucide-react'
import { LoginBrandLogo } from '@/components/auth/LoginBrandLogo'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { isApiEnabled } from '@/api/config'
import { loginAndBootstrap } from '@/api/bootstrap'
import { ApiError } from '@/api/client'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/home'
  const apiOn = isApiEnabled()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!apiOn) {
      navigate(from)
      return
    }

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await loginAndBootstrap(email.trim(), password)
      navigate(from)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="no-scrollbar mx-auto flex h-full w-full max-w-[390px] flex-col overflow-y-auto bg-bg px-6 pb-8 pt-6">
      <div className="mb-1 flex justify-center">
        <LoginBrandLogo />
      </div>

      <h1 className="text-[34px] font-extrabold leading-tight text-ink">
        Track Smarter
        <br />
        <span className="text-primary">Spending</span>
      </h1>
      <p className="mt-3 text-[16px] leading-snug text-muted">
        Take control of your money and build a better financial future.
      </p>

      <div className="mt-7 space-y-3">
        <FormField
          type="email"
          placeholder="Email address"
          leftIcon={<Mail size={20} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <FormField
          type={showPw ? 'text' : 'password'}
          placeholder="Password"
          leftIcon={<Lock size={20} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightSlot={
            <button onClick={() => setShowPw((v) => !v)} className="text-muted" type="button">
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="block w-full text-right text-[13px] font-bold text-primary active:opacity-80"
        >
          Forgot password?
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
      )}

      <div className="mt-5 space-y-3">
        <ActionButton onClick={() => void handleLogin()} disabled={loading}>
          {loading ? 'Signing in…' : 'Log In'}
        </ActionButton>
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

      {!apiOn && (
        <p className="mt-4 text-center text-[12px] text-muted">Offline mode — data stays in local storage.</p>
      )}

      {!apiOn && (
        <>
          <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            or continue with
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(from)}
              className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-input border border-line bg-surface text-[16px] font-bold text-ink active:bg-surfaceSoft"
            >
              <Apple size={20} fill="currentColor" /> Continue with Apple
            </button>
            <button
              onClick={() => navigate(from)}
              className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-input border border-line bg-surface text-[16px] font-bold text-ink active:bg-surfaceSoft"
            >
              <span className="text-[18px] font-extrabold text-[#4285F4]">G</span> Continue with Google
            </button>
          </div>
        </>
      )}
    </div>
  )
}
