import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ActionButton } from '@/components/ui/ActionButton'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { confirmEmailVerification, getMe, requestEmailVerification } from '@/api/auth'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { useAuthStore } from '@/store/authStore'

export function Verification() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiOn = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const token = useMemo(() => new URLSearchParams(location.search).get('token') ?? '', [location.search])
  const [email, setEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [verified, setVerified] = useState(Boolean(user?.email_verified_at))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !apiOn) return
    let cancelled = false
    setLoading(true)
    setError('')
    confirmEmailVerification(token)
      .then(async () => {
        if (cancelled) return
        setVerified(true)
        try {
          const freshUser = await getMe()
          setUser(freshUser)
        } catch {
          // The token is still confirmed even if the session is gone.
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not verify email.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiOn, setUser, token])

  async function handleSend() {
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
      await requestEmailVerification(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send verification email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Verify Email" showBack />}>
      <div className="mt-4 space-y-4">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primarySoft text-primary">
              {verified ? <CheckCircle2 size={24} /> : <Mail size={24} />}
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold text-ink">
                {verified ? 'Email Verified' : 'Verify Your Email'}
              </h1>
              <p className="mt-1 text-[14px] leading-snug text-muted">
                {verified
                  ? 'Your Budgii account email is verified.'
                  : 'Budgii sends a secure link to confirm this email belongs to you.'}
              </p>
            </div>
          </div>
        </Card>

        {!verified && (
          <Card className="space-y-4 p-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail size={18} />}
              autoComplete="email"
            />
            <ActionButton onClick={() => void handleSend()} disabled={loading}>
              {loading ? 'Sending...' : sent ? 'Send Again' : 'Send Verification Link'}
            </ActionButton>
          </Card>
        )}

        {sent && !verified && (
          <p className="rounded-input bg-greenSoft px-4 py-2 text-[13px] font-semibold text-green">
            If that email has a Budgii account, a verification link is on the way.
          </p>
        )}
        {error && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
        )}

        {verified && (
          <ActionButton
            onClick={() => {
              navigate('/home')
            }}
          >
            Continue
          </ActionButton>
        )}
      </div>
    </AppShell>
  )
}
