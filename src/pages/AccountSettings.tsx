import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  Lock,
  Mail,
  User as UserIcon,
  X,
  Shield,
  ChevronRight,
  MonitorSmartphone,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { PinSetupModal } from '@/components/security/PinSetupModal'
import { ApiError } from '@/api/client'
import { changePassword, logout, updateMe, uploadAvatar } from '@/api/auth'
import { isApiEnabled } from '@/api/config'
import { useUserAvatarUrl } from '@/hooks/useUserAvatarUrl'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'

const EMOJI_AVATARS = ['👤', '👨', '👩', '🧑', '😊', '😎', '🧔', '👵', '🧓', '👶', '💼', '🎨']

// avatar can be an emoji, remote image URL, local preview, or server-backed upload path
const isImage = (a?: string) => !!a && /^(blob:|data:|https?:|\/)/.test(a)

export function AccountSettings() {
  const navigate = useNavigate()
  const userProfile = useStore((s) => s.userProfile)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const hasPin = useStore((s) => !!s.appLock.pinHash)
  const apiUser = useAuthStore((s) => s.user)
  const apiOn = isApiEnabled()

  const [name, setName] = useState(apiUser?.name || userProfile.name || 'Alex Johnson')
  const [email, setEmail] = useState(apiUser?.email || userProfile.email || 'dev@mjproductions.app')
  const [avatar, setAvatar] = useState(apiUser?.avatar || userProfile.avatar || '🧑')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const [showEmoji, setShowEmoji] = useState(false)
  const [pinModal, setPinModal] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const resolvedAvatar = useUserAvatarUrl(avatar)
  const displayAvatar = avatar.startsWith('/users/me/avatar') ? resolvedAvatar : avatar

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)

    if (!apiOn) return

    setError('')
    setSaving(true)
    try {
      const user = await uploadAvatar(file)
      const savedAvatar = user.avatar ?? undefined
      setAvatar(savedAvatar || '🧑')
      setAvatarFile(null)
      setUserProfile({ avatar: savedAvatar })
      flashSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload profile photo.')
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (saving) return
    if ((newPw || confirmPw) && newPw !== confirmPw) {
      setError('Passwords do not match')
      return
    }
    if (apiOn && newPw && !currentPw) {
      setError('Enter your current password to change it.')
      return
    }
    if (apiOn && isImage(avatar) && avatar.startsWith('data:') && !avatarFile) {
      setError('Choose the photo again so Budgii can upload it.')
      return
    }

    setError('')
    setSaving(true)

    try {
      if (apiOn) {
        let user = await updateMe({
          name,
          email,
          avatar: avatarFile ? undefined : avatar,
        })

        if (avatarFile) {
          user = await uploadAvatar(avatarFile)
        }

        if (newPw) {
          await changePassword(currentPw, newPw)
        }

        const savedAvatar = user.avatar ?? undefined
        setAvatar(savedAvatar || '🧑')
        setAvatarFile(null)
        setUserProfile({
          name: user.name,
          email: user.email,
          avatar: savedAvatar,
        })
      } else {
        setUserProfile({ name, email, avatar })
      }

      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      flashSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save account changes.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Account" showBack />}>
      {/* Avatar */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primarySoft shadow-card">
            {isImage(displayAvatar) ? (
              <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-6xl">{displayAvatar || '🧑'}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={saving}
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
            <button
              onClick={() => setShowEmoji(false)}
              className="rounded-full p-1 text-muted active:bg-line/40"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setAvatar(emoji)
                  setAvatarFile(null)
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
          {apiOn && (
            <div className="rounded-input bg-surfaceSoft px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-ink">Email Verification</p>
                  <p className="text-[12px] text-muted">
                    {apiUser?.email_verified_at ? 'Verified' : 'Verification link required'}
                  </p>
                </div>
                {!apiUser?.email_verified_at && (
                  <button
                    type="button"
                    onClick={() => navigate('/verification')}
                    className="text-[13px] font-bold text-primary"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Security */}
      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">App Lock</h2>
        <Card className="divide-y divide-line/70">
          <button
            type="button"
            onClick={() => setPinModal(true)}
            className="flex w-full items-center gap-3 pb-3 text-left active:opacity-80"
          >
            <Shield size={20} className="text-primary" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-ink">{hasPin ? 'Change PIN' : 'Set PIN'}</p>
              <p className="text-[13px] text-muted">
                {hasPin ? 'Update your 4-digit unlock code' : 'Require a PIN when you return to Budgii'}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/active-sessions')}
            className="flex w-full items-center gap-3 pt-3 text-left active:opacity-80"
          >
            <MonitorSmartphone size={20} className="text-muted" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-ink">Active Sessions</p>
              <p className="text-[13px] text-muted">Review signed-in devices</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </Card>
      </div>

      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Email &amp; Password
        </h2>
        <Card className="space-y-3">
          {apiOn && (
            <FormField
              label="Current Password"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Required to change password"
              leftIcon={<Lock size={18} />}
            />
          )}
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
        <ActionButton
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          className={saved ? 'bg-green' : ''}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </ActionButton>
      </div>

      <button onClick={handleLogout} className="mt-3 w-full py-3 text-center text-[15px] font-bold text-red">
        Log Out
      </button>

      <PinSetupModal open={pinModal} onClose={() => setPinModal(false)} mode={hasPin ? 'change' : 'create'} />
    </AppShell>
  )
}
