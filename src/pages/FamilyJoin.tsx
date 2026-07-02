import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, KeyRound, User, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { ActionButton } from '@/components/ui/ActionButton'
import { useStore } from '@/store/appStore'
import { formatInviteCode, normalizeInviteCode } from '@/utils/familyInvite'

type JoinError = 'invalid' | 'used' | ''

export function FamilyJoin() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const findFamilyInvite = useStore((s) => s.findFamilyInvite)
  const useFamilyInvite = useStore((s) => s.useFamilyInvite)
  const addFamilyMember = useStore((s) => s.addFamilyMember)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<JoinError>('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    const fromLink = params.get('code')
    if (fromLink) setCode(formatInviteCode(fromLink))
  }, [params])

  const normalizedCode = normalizeInviteCode(code)
  const canJoin = normalizedCode.length >= 6 && name.trim().length >= 2

  function handleCodeChange(value: string) {
    const clean = value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase()
    const compact = clean.replace(/\s+/g, '').slice(0, 6)
    setCode(formatInviteCode(compact))
    if (error) setError('')
  }

  function handleJoin() {
    const trimmedName = name.trim()
    if (!canJoin) return

    const invite = findFamilyInvite(normalizedCode)
    if (!invite) {
      setError('invalid')
      return
    }
    if (invite.usedAt) {
      setError('used')
      return
    }

    const memberId = addFamilyMember({
      name: trimmedName,
      relationship: 'Family',
      avatar: '👤',
      active: true,
      hasAppAccess: true,
      accessRole: invite.accessRole,
      editorLevel: invite.editorLevel,
    })
    const ok = useFamilyInvite(normalizedCode, memberId)
    if (!ok) {
      setError('invalid')
      return
    }

    setJoined(true)
  }

  if (joined) {
    return (
      <AppShell topBar={<TopBar title="Join Household" showBack />}>
        <Card className="bg-gradient-to-br from-greenSoft to-accentSoft text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green/15">
            <CheckCircle2 size={30} className="text-green" />
          </div>
          <h2 className="mt-4 text-[20px] font-extrabold text-ink">You&apos;re in!</h2>
          <p className="mt-2 text-[14px] leading-snug text-muted">
            Welcome, {name.trim()}. You&apos;ve joined the household and can start tracking expenses together.
          </p>
        </Card>

        <ActionButton className="mt-4" onClick={() => navigate('/family-members')}>
          View Family Members
        </ActionButton>
        <ActionButton className="mt-3" variant="outline" onClick={() => navigate('/home')}>
          Go to Home
        </ActionButton>
      </AppShell>
    )
  }

  return (
    <AppShell topBar={<TopBar title="Join Household" showBack />}>
      <Card className="bg-gradient-to-br from-primarySoft to-accentSoft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70">
            <Users size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Join a household</h2>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Enter the invite code you received by email, text, or QR scan.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-4 space-y-4">
        <FormField
          label="Invite code"
          placeholder="e.g. 4G0 MVG"
          leftIcon={<KeyRound size={18} />}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          autoCapitalize="characters"
          autoComplete="one-time-code"
          inputMode="text"
        />
        <FormField
          label="Your name"
          placeholder="How should we show you?"
          leftIcon={<User size={18} />}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError('')
          }}
          autoComplete="name"
        />

        {error === 'invalid' && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            That code isn&apos;t valid. Check it and try again.
          </p>
        )}
        {error === 'used' && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            This code has already been used. Ask for a new invite.
          </p>
        )}

        <ActionButton onClick={handleJoin} disabled={!canJoin}>
          Join Household
        </ActionButton>
      </Card>

      <p className="mt-4 text-center text-[13px] text-muted">
        Don&apos;t have Budgii yet?{' '}
        <button type="button" onClick={() => navigate('/onboarding')} className="font-bold text-primary">
          Create an account
        </button>
      </p>
    </AppShell>
  )
}
