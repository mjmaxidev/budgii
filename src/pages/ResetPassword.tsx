import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { confirmPasswordReset } from '@/api/auth'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'

export function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useMemo(() => new URLSearchParams(location.search).get('token') ?? '', [location.search])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const apiOn = isApiEnabled()

  async function handleSubmit() {
    if (!token) {
      setError('Reset link is missing a token.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!apiOn) {
      setDone(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      await confirmPasswordReset(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password.')
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

      <h1 className="text-[30px] font-extrabold leading-tight text-ink">Choose New Password</h1>
      <p className="mt-3 text-[15px] leading-snug text-muted">
        Set a new password for your Budgii email account.
      </p>

      <div className="mt-7 space-y-3">
        <FormField
          type={showPw ? 'text' : 'password'}
          placeholder="New password"
          leftIcon={<Lock size={20} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          rightSlot={
            <button onClick={() => setShowPw((v) => !v)} className="text-muted" type="button">
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <FormField
          type={showPw ? 'text' : 'password'}
          placeholder="Confirm new password"
          leftIcon={<Lock size={20} />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
      )}
      {done && (
        <p className="mt-4 rounded-input bg-greenSoft px-4 py-2 text-[13px] font-semibold text-green">
          Password reset. You can sign in with the new password.
        </p>
      )}

      <div className="mt-5">
        <ActionButton onClick={() => (done ? navigate('/login') : void handleSubmit())} disabled={loading}>
          {loading ? 'Resetting...' : done ? 'Go to Login' : 'Reset Password'}
        </ActionButton>
      </div>
    </div>
  )
}
