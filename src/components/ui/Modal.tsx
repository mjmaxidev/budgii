import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** sheet slides up from bottom (default), or center dialog */
  variant?: 'sheet' | 'center'
}

export function Modal({ open, onClose, title, children, variant = 'sheet' }: Props) {
  if (!open) return null

  // Render inside the phone frame so the sheet/dialog is clipped to the device,
  // not the whole review-studio window. Falls back to the body (full-bleed phone
  // layout on small screens, where the frame fills the viewport anyway).
  const host = (typeof document !== 'undefined' && document.getElementById('mobile-frame-root')) || (typeof document !== 'undefined' ? document.body : null)
  if (!host) return null

  const overlay = (
    <div className="absolute inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease]" />
      <div
        className={
          variant === 'sheet'
            ? 'relative mt-auto max-h-[88%] w-full overflow-y-auto rounded-t-[28px] bg-surface px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1.75rem)] shadow-ring'
            : 'relative m-auto max-h-[88%] w-[min(92%,400px)] overflow-y-auto rounded-card bg-surface px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-ring'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {variant === 'sheet' && (
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        )}
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1 text-muted active:bg-line/40">
              <X size={22} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )

  return createPortal(overlay, host)
}
