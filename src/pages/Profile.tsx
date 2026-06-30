import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { SelectRow } from '@/components/ui/SelectRow'
import { useStore } from '@/store/appStore'

const EMOJI_AVATARS = ['👤', '👨', '👩', '🧑', '😊', '😌', '🤗', '😎', '🧠', '💼', '🎨', '🎭']

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

export function Profile() {
  const navigate = useNavigate()
  const userProfile = useStore((s) => s.userProfile)
  const setUserProfile = useStore((s) => s.setUserProfile)
  const updateUserPreferences = useStore((s) => s.updateUserPreferences)

  // Form state
  const [name, setName] = useState(userProfile.name)
  const [email, setEmail] = useState(userProfile.email)
  const [avatar, setAvatar] = useState(userProfile.avatar || '🧑')
  const [notifications, setNotifications] = useState(userProfile.preferences.notifications)
  const [language, setLanguage] = useState(userProfile.preferences.language)

  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setUserProfile({
      name,
      email,
      avatar,
      preferences: {
        ...userProfile.preferences,
        notifications,
        language,
      },
    })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleLogout = () => {
    navigate('/login')
  }

  const currentLanguageLabel =
    LANGUAGES.find((l) => l.code === language)?.label || 'English'

  return (
    <AppShell
      showBottomNav
      topBar={<TopBar title="Profile" showBack />}
    >
      {/* Avatar Section */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-primarySoft text-5xl shadow-card transition active:scale-95"
          >
            {avatar}
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-soft transition active:scale-90"
            aria-label="Change avatar"
          >
            ✏️
          </button>
        </div>

        {/* Emoji Picker Modal */}
        {showEmojiPicker && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40">
            <div className="w-full rounded-t-card bg-white p-4 shadow-ring">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-ink">Choose Avatar</h3>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-line/40"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setAvatar(emoji)
                      setShowEmojiPicker(false)
                    }}
                    className={`flex h-12 items-center justify-center rounded-xl text-3xl transition ${
                      avatar === emoji
                        ? 'bg-primarySoft ring-2 ring-primary'
                        : 'bg-line/30 active:bg-line/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Sections */}
      <div className="mt-6 space-y-5">
        {/* Personal Information */}
        <div>
          <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
            Personal Information
          </h2>
          <Card className="space-y-3">
            <FormField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </Card>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
            Preferences
          </h2>
          <Card className="space-y-4 p-4">
            {/* Language Selection */}
            <SelectRow
              label="Language"
              value={currentLanguageLabel}
              left={<span className="text-lg">🌐</span>}
              onClick={() => setShowLanguageSelect(!showLanguageSelect)}
            />
            {showLanguageSelect && (
              <div className="border-t border-line/60 pt-3 -mx-4 px-4">
                <div className="space-y-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLanguageSelect(false)
                      }}
                      className={`w-full rounded-input border px-4 py-2.5 text-left text-[15px] font-semibold transition ${
                        language === lang.code
                          ? 'border-primary bg-primarySoft text-primary'
                          : 'border-line bg-surface text-ink active:bg-surfaceSoft'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications Toggle */}
            <div className="border-t border-line/60 pt-3 -mx-4 px-4">
              <ToggleRow
                icon={<Bell size={20} />}
                title="Notifications"
                description="Budget alerts and weekly summaries"
                checked={notifications}
                onChange={setNotifications}
                iconBg="#FFF0E5"
              />
            </div>
          </Card>
        </div>

        {/* Save & Logout Section */}
        <div className="space-y-2.5">
          <ActionButton
            variant="primary"
            onClick={handleSave}
            className={isSaved ? 'bg-green' : ''}
          >
            {isSaved ? '✓ Saved' : 'Save Changes'}
          </ActionButton>

          <ActionButton
            variant="outline"
            leftIcon={<LogOut size={18} />}
            onClick={handleLogout}
          >
            Logout
          </ActionButton>
        </div>
      </div>
    </AppShell>
  )
}
