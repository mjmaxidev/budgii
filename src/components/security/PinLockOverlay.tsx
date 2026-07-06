import { useState } from 'react'
import { PinPad } from '@/components/security/PinPad'
import { useStore } from '@/store/appStore'
import budgiiLogo from '@/assets/budgii-logo.png'

type Props = {
  onUnlock: () => void
}

export function PinLockOverlay({ onUnlock }: Props) {
  const verifyAppPin = useStore((s) => s.verifyAppPin)
  const userName = useStore((s) => s.userProfile.name)

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function tryUnlock(value: string) {
    setBusy(true)
    setError('')
    const ok = await verifyAppPin(value)
    if (ok) {
      setPin('')
      onUnlock()
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
    setBusy(false)
  }

  return (
    <div className="safe-top absolute inset-0 z-[100] flex flex-col bg-bg px-6 pt-10 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <img src={budgiiLogo} alt="Budgii" className="mb-6 w-[min(280px,85vw)] object-contain" />
        <h1 className="text-[24px] font-extrabold text-ink">Welcome back</h1>
        <p className="mt-2 text-center text-[15px] text-muted">
          {userName ? `Hi ${userName.split(' ')[0]}, enter your PIN` : 'Enter your PIN to continue'}
        </p>

        <div className="mt-10 w-full max-w-[280px]">
          <PinPad
            value={pin}
            onChange={(v) => {
              setError('')
              setPin(v)
            }}
            onComplete={(v) => void tryUnlock(v)}
            error={error}
            disabled={busy}
          />
        </div>
      </div>

      <p className="text-center text-[12px] text-muted">Budgii keeps your household budget private on this device.</p>
    </div>
  )
}
