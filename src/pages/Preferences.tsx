import { useState } from 'react'
import { Bell, DollarSign, Languages, Moon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { SelectRow } from '@/components/ui/SelectRow'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { isApiEnabled } from '@/api/config'
import { flushSyncNow } from '@/api/syncEngine'
import { useStore } from '@/store/appStore'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

export function Preferences() {
  const prefs = useStore((s) => s.userProfile.preferences)
  const settings = useStore((s) => s.settings)
  const updatePrefs = useStore((s) => s.updateUserPreferences)
  const updateSettings = useStore((s) => s.updateSettings)

  const [currency, setCurrency] = useState(settings.currency || prefs.currency)
  const [language, setLanguage] = useState(prefs.language)
  const [notifications, setNotifications] = useState(settings.notificationsEnabled)
  const [budgetWarnings, setBudgetWarnings] = useState(settings.notificationBudgetWarnings)
  const [budgetExceeded, setBudgetExceeded] = useState(settings.notificationBudgetExceeded)
  const [dealMatches, setDealMatches] = useState(settings.notificationDeals)
  const [weeklySummary, setWeeklySummary] = useState(settings.notificationWeeklySummary)
  const [quietHours, setQuietHours] = useState(settings.notificationQuietHoursEnabled)
  const [quietStart, setQuietStart] = useState(settings.notificationQuietHoursStart)
  const [quietEnd, setQuietEnd] = useState(settings.notificationQuietHoursEnd)

  const [openCurrency, setOpenCurrency] = useState(false)
  const [openLanguage, setOpenLanguage] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savedCurrency = settings.currency || prefs.currency
  const savedNotifications = settings.notificationsEnabled
  const savedNotificationSettings = {
    budgetWarnings: settings.notificationBudgetWarnings,
    budgetExceeded: settings.notificationBudgetExceeded,
    dealMatches: settings.notificationDeals,
    weeklySummary: settings.notificationWeeklySummary,
    quietHours: settings.notificationQuietHoursEnabled,
    quietStart: settings.notificationQuietHoursStart,
    quietEnd: settings.notificationQuietHoursEnd,
  }

  const currencyLabel = CURRENCIES.find((c) => c.code === currency)?.label || currency
  const languageLabel = LANGUAGES.find((l) => l.code === language)?.label || 'English'

  const dirty =
    currency !== savedCurrency ||
    language !== prefs.language ||
    notifications !== savedNotifications ||
    budgetWarnings !== savedNotificationSettings.budgetWarnings ||
    budgetExceeded !== savedNotificationSettings.budgetExceeded ||
    dealMatches !== savedNotificationSettings.dealMatches ||
    weeklySummary !== savedNotificationSettings.weeklySummary ||
    quietHours !== savedNotificationSettings.quietHours ||
    quietStart !== savedNotificationSettings.quietStart ||
    quietEnd !== savedNotificationSettings.quietEnd

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    updatePrefs({ currency, language, notifications })
    updateSettings({
      currency,
      notificationsEnabled: notifications,
      notificationBudgetWarnings: budgetWarnings,
      notificationBudgetExceeded: budgetExceeded,
      notificationDeals: dealMatches,
      notificationWeeklySummary: weeklySummary,
      notificationQuietHoursEnabled: quietHours,
      notificationQuietHoursStart: quietStart,
      notificationQuietHoursEnd: quietEnd,
    })
    try {
      if (isApiEnabled()) {
        await flushSyncNow()
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Could not sync preferences. They are saved on this device and will retry automatically.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="App Preferences" showBack />}>
      <div className="mt-4 space-y-5">
        {/* Regional */}
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Regional</h2>
          <Card className="space-y-1 p-4">
            <SelectRow
              label="Currency"
              value={currencyLabel}
              left={<DollarSign size={18} className="text-muted" />}
              onClick={() => {
                setOpenCurrency((v) => !v)
                setOpenLanguage(false)
              }}
            />
            {openCurrency && (
              <OptionList
                options={CURRENCIES}
                selected={currency}
                onSelect={(code) => {
                  setCurrency(code)
                  setOpenCurrency(false)
                }}
              />
            )}

            <div className="border-t border-line/60 pt-1">
              <SelectRow
                label="Language"
                value={languageLabel}
                left={<Languages size={18} className="text-muted" />}
                onClick={() => {
                  setOpenLanguage((v) => !v)
                  setOpenCurrency(false)
                }}
              />
            </div>
            {openLanguage && (
              <OptionList
                options={LANGUAGES}
                selected={language}
                onSelect={(code) => {
                  setLanguage(code)
                  setOpenLanguage(false)
                }}
              />
            )}
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
            Notifications
          </h2>
          <Card className="p-4">
            <ToggleRow
              icon={<Bell size={20} />}
              title="Push Notifications"
              description="Allow Budgii to send alerts outside the app"
              checked={notifications}
              onChange={setNotifications}
              iconBg="#FFF0E5"
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
            Notification Types
          </h2>
          <Card className="divide-y divide-line/70 px-4 py-1">
            <ToggleRow
              title="Budget Warnings"
              description="When a category is close to its limit"
              checked={budgetWarnings}
              onChange={setBudgetWarnings}
            />
            <ToggleRow
              title="Over-Budget Alerts"
              description="When spending passes a category limit"
              checked={budgetExceeded}
              onChange={setBudgetExceeded}
              iconBg="#FFE5E5"
            />
            <ToggleRow
              title="Deal Matches"
              description="When watchlist items get a new deal"
              checked={dealMatches}
              onChange={setDealMatches}
              iconBg="#EAF8ED"
            />
            <ToggleRow
              title="Weekly Summary"
              description="A short recap of household spending"
              checked={weeklySummary}
              onChange={setWeeklySummary}
              iconBg="#E0F2FE"
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Quiet Hours</h2>
          <Card className="space-y-3 p-4">
            <ToggleRow
              icon={<Moon size={20} />}
              title="Pause Push Alerts"
              description="Hold non-urgent push alerts during this window"
              checked={quietHours}
              onChange={setQuietHours}
              iconBg="#F0EAFE"
            />
            {quietHours && (
              <div className="grid grid-cols-2 gap-3 border-t border-line/60 pt-3">
                <FormField
                  label="Start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                />
                <FormField
                  label="End"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Save */}
        {error && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || (!dirty && !saved)}
          className={`w-full rounded-2xl py-4 text-center text-[16px] font-bold text-white transition ${
            saved ? 'bg-green' : dirty ? 'bg-primary active:bg-primary/90' : 'bg-primary/40'
          }`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : dirty ? 'Save Changes' : 'Saved'}
        </button>
      </div>
    </AppShell>
  )
}

function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: { code: string; label: string }[]
  selected: string
  onSelect: (code: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 pb-1 pt-1">
      {options.map((o) => (
        <button
          key={o.code}
          onClick={() => onSelect(o.code)}
          className={`w-full rounded-input border px-4 py-2.5 text-left text-[15px] font-semibold transition ${
            selected === o.code
              ? 'border-primary bg-primarySoft text-primary'
              : 'border-line bg-surface text-ink active:bg-surfaceSoft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
