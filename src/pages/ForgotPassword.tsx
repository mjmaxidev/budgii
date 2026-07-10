import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { requestPasswordReset } from '@/api/auth'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const apiOn = isApiEnabled()

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }
    if (!apiOn) {
      setSent(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[390px] flex-col bg-bg px-6 pb-8 pt-10">
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="mb-8 self-start text-[14px] font-bold text-primary"
      >
        Back to login
      </button>

      <h1 className="text-[30px] font-extrabold leading-tight text-ink">Reset Password</h1>
      <p className="mt-3 text-[15px] leading-snug text-muted">
        Enter your account email and Budgii will send a secure reset link if the account exists.
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
      </div>

      {error && (
        <p className="mt-4 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
      )}
      {sent && (
        <p className="mt-4 rounded-input bg-greenSoft px-4 py-2 text-[13px] font-semibold text-green">
          If that email has a Budgii account, a reset link is on the way.
        </p>
      )}

      <div className="mt-5">
        <ActionButton onClick={() => void handleSubmit()} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </ActionButton>
      </div>
    </div>
  )
}
