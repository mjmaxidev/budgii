import { Shield } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'

type Props = {
  open: boolean
  onSetUp: () => void
  onLater: () => void
}

export function PinSetupPromptModal({ open, onSetUp, onLater }: Props) {
  return (
    <Modal open={open} onClose={onLater} title="Protect your budget" variant="center">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primarySoft">
          <Shield size={32} className="text-primary" />
        </div>
        <p className="text-[15px] leading-relaxed text-muted">
          Set up a 4-digit PIN so only you can open Budgii when you step away from the app.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <ActionButton onClick={onSetUp}>Set Up PIN</ActionButton>
        <ActionButton variant="ghost" fullWidth onClick={onLater}>
          Maybe Later
        </ActionButton>
      </div>
    </Modal>
  )
}
