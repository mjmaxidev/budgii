import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Lock, Mail, User as UserIcon, X, Shield, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { PinSetupModal } from '@/components/security/PinSetupModal'
import { useStore } from '@/store/appStore'

const EMOJI_AVATARS = ['👤', '👨', '👩', '🧑', '😊', '😎', '🧔', '👵', '🧓', '👶', '💼', '🎨']

// avatar can be an emoji (default) or an uploaded image stored as a data URL
const isImage = (a?: string) => !!a && /^(data:|https?:|\/)/.test(a)

export function AccountSettings() {
  const navigate = useNavigate()
  const userProfile = useStore((s) => s.userProfile)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const hasPin = useStore((s) => !!s.appLock.pinHash)

  const [name, setName] = useState(userProfile.name || 'Alex Johnson')
  const [email, setEmail] = useState(userProfile.email || 'dev@mjproductions.app')
  const [avatar, setAvatar] = useState(userProfile.avatar || '🧑')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const [showEmoji, setShowEmoji] = useState(false)
  const [pinModal, setPinModal] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if ((newPw || confirmPw) && newPw !== confirmPw) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setUserProfile({ name, email, avatar })
    setNewPw('')
    setConfirmPw('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Account" showBack />}>
      {/* Avatar */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primarySoft shadow-card">
            {isImage(avatar) ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl">{avatar}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-soft transition active:scale-90"
            aria-label="Upload photo"
          >
            <Camera size={18} />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
        <button onClick={() => setShowEmoji((v) => !v)} className="text-[14px] font-semibold text-primary">
          Choose an emoji instead
        </button>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <Card className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">Choose Avatar</h3>
            <button onClick={() => setShowEmoji(false)} className="rounded-full p-1 text-muted active:bg-line/40">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setAvatar(emoji)
                  setShowEmoji(false)
                }}
                className={`flex h-12 items-center justify-center rounded-xl text-3xl transition ${
                  avatar === emoji ? 'bg-primarySoft ring-2 ring-primary' : 'bg-line/30 active:bg-line/50'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Personal info */}
      <div className="mt-6">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Profile</h2>
        <Card className="space-y-3">
          <FormField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            leftIcon={<UserIcon size={18} />}
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            leftIcon={<Mail size={18} />}
          />
        </Card>
      </div>

      {/* Security */}
      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">App Lock</h2>
        <Card>
          <button
            type="button"
            onClick={() => setPinModal(true)}
            className="flex w-full items-center gap-3 py-1 text-left active:opacity-80"
          >
            <Shield size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-ink">
                {hasPin ? 'Change PIN' : 'Set PIN'}
              </p>
              <p className="text-[13px] text-muted">
                {hasPin ? 'Update your 4-digit unlock code' : 'Require a PIN when you return to Budgii'}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </Card>
      </div>

      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Email &amp; Password</h2>
        <Card className="space-y-3">
          <FormField
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Leave blank to keep current"
            leftIcon={<Lock size={18} />}
          />
          <FormField
            label="Confirm Password"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Re-enter new password"
            leftIcon={<Lock size={18} />}
          />
          {error && <p className="text-[13px] font-semibold text-red">{error}</p>}
        </Card>
      </div>

      {/* Save */}
      <div className="mt-6">
        <ActionButton variant="primary" onClick={handleSave} className={saved ? 'bg-green' : ''}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </ActionButton>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="mt-3 w-full py-3 text-center text-[15px] font-bold text-red"
      >
        Log Out
      </button>

      <PinSetupModal
        open={pinModal}
        onClose={() => setPinModal(false)}
        mode={hasPin ? 'change' : 'create'}
      />
    </AppShell>
  )
}
