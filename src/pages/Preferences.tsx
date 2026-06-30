import { useState } from 'react'
import { Bell, DollarSign, Languages } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { SelectRow } from '@/components/ui/SelectRow'
import { ToggleRow } from '@/components/ui/ToggleRow'
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
  const updatePrefs = useStore((s) => s.updateUserPreferences)

  const [openCurrency, setOpenCurrency] = useState(false)
  const [openLanguage, setOpenLanguage] = useState(false)

  const currencyLabel = CURRENCIES.find((c) => c.code === prefs.currency)?.label || prefs.currency
  const languageLabel = LANGUAGES.find((l) => l.code === prefs.language)?.label || 'English'

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
              onClick={() => { setOpenCurrency((v) => !v); setOpenLanguage(false) }}
            />
            {openCurrency && (
              <OptionList
                options={CURRENCIES}
                selected={prefs.currency}
                onSelect={(code) => { updatePrefs({ currency: code }); setOpenCurrency(false) }}
              />
            )}

            <div className="border-t border-line/60 pt-1">
              <SelectRow
                label="Language"
                value={languageLabel}
                left={<Languages size={18} className="text-muted" />}
                onClick={() => { setOpenLanguage((v) => !v); setOpenCurrency(false) }}
              />
            </div>
            {openLanguage && (
              <OptionList
                options={LANGUAGES}
                selected={prefs.language}
                onSelect={(code) => { updatePrefs({ language: code }); setOpenLanguage(false) }}
              />
            )}
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Notifications</h2>
          <Card className="p-4">
            <ToggleRow
              icon={<Bell size={20} />}
              title="Push Notifications"
              description="Budget alerts and weekly summaries"
              checked={prefs.notifications}
              onChange={(v) => updatePrefs({ notifications: v })}
              iconBg="#FFF0E5"
            />
          </Card>
        </div>
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
