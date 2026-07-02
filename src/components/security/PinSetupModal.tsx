import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { PinPad } from '@/components/security/PinPad'
import { useStore } from '@/store/appStore'

type Mode = 'create' | 'change'

type Props = {
  open: boolean
  onClose: () => void
  mode: Mode
  onSuccess?: () => void
}

type Step = 'current' | 'enter' | 'confirm'

export function PinSetupModal({ open, onClose, mode, onSuccess }: Props) {
  const hasPin = useStore((s) => !!s.appLock.pinHash)
  const setAppPin = useStore((s) => s.setAppPin)
  const changeAppPin = useStore((s) => s.changeAppPin)
  const verifyAppPin = useStore((s) => s.verifyAppPin)

  const [step, setStep] = useState<Step>(mode === 'change' && hasPin ? 'current' : 'enter')
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(mode === 'change' && hasPin ? 'current' : 'enter')
    setCurrent('')
    setPin('')
    setConfirm('')
    setError('')
    setBusy(false)
  }, [open, mode, hasPin])

  function close() {
    onClose()
  }

  async function finish(newPin: string) {
    setBusy(true)
    setError('')
    try {
      if (mode === 'change' && hasPin) {
        const result = await changeAppPin(current, newPin)
        if (!result.ok) {
          setError(result.error ?? 'Could not update PIN')
          setConfirm('')
          setBusy(false)
          return
        }
      } else {
        await setAppPin(newPin)
      }
      onSuccess?.()
      close()
    } catch {
      setError('Something went wrong. Try again.')
      setConfirm('')
    } finally {
      setBusy(false)
    }
  }

  async function onCurrentComplete(value: string) {
    const ok = await verifyAppPin(value)
    if (!ok) {
      setError('Incorrect PIN')
      setCurrent('')
      return
    }
    setError('')
    setStep('enter')
  }

  function onEnterComplete(value: string) {
    setPin(value)
    setStep('confirm')
  }

  function onConfirmComplete(value: string) {
    if (value !== pin) {
      setError('PINs do not match')
      setConfirm('')
      setPin('')
      setStep('enter')
      return
    }
    void finish(value)
  }

  const titles: Record<Step, string> = {
    current: 'Enter current PIN',
    enter: mode === 'change' ? 'Enter new PIN' : 'Create a 4-digit PIN',
    confirm: 'Confirm your PIN',
  }

  const subtitles: Record<Step, string> = {
    current: 'Verify your identity to change your PIN.',
    enter: 'You will use this when returning to Budgii.',
    confirm: 'Enter the same PIN again.',
  }

  const values: Record<Step, string> = { current, enter: pin, confirm }
  const setters: Record<Step, (v: string) => void> = {
    current: setCurrent,
    enter: setPin,
    confirm: setConfirm,
  }
  const handlers: Record<Step, (v: string) => void> = {
    current: (v) => void onCurrentComplete(v),
    enter: onEnterComplete,
    confirm: onConfirmComplete,
  }

  return (
    <Modal open={open} onClose={close} title={titles[step]} variant="center">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primarySoft">
          <Shield size={28} className="text-primary" />
        </div>
        <p className="text-[14px] text-muted">{subtitles[step]}</p>
      </div>

      <PinPad
        value={values[step]}
        onChange={(v) => {
          setError('')
          setters[step](v)
        }}
        onComplete={handlers[step]}
        error={error}
        disabled={busy}
      />

      <ActionButton variant="ghost" fullWidth className="mt-5" onClick={close}>
        Cancel
      </ActionButton>
    </Modal>
  )
}
