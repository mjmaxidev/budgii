import { useNavigate } from 'react-router-dom'
import {
  User, Mail, DollarSign, Languages, Wallet, Users, Home,
  ScanLine, Sparkles, ShieldCheck, FileText, Bell, BarChart3, Database, LifeBuoy, LogOut,
  Trash2, ChevronRight, Tags, Gift,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/appStore'

type Item = { icon: typeof User; label: string; to?: string; soon?: boolean; danger?: boolean; action?: () => void }

// avatar can be an emoji or an uploaded image stored as a data URL
const isImage = (a?: string) => !!a && /^(data:|https?:|\/)/.test(a)

export function Settings() {
  const navigate = useNavigate()
  const resetData = useStore((s) => s.resetData)
  const userProfile = useStore((s) => s.userProfile)

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: DollarSign, label: 'Currency' },
        { icon: Languages, label: 'Language' },
      ],
    },
    {
      title: 'Budget',
      items: [
        { icon: Wallet, label: 'Budget Setting', to: '/budget-setup' },
      ],
    },
    {
      title: 'Family',
      items: [
        { icon: Users, label: 'Manage Family Members', to: '/family-members' },
        { icon: Home, label: 'Shared Household Profile', soon: true },
      ],
    },
    {
      title: 'Categories & Tags',
      items: [
        { icon: Tags, label: 'Manage Categories and Tags', to: '/categories-tags' },
      ],
    },
    {
      title: 'Receipt & AI',
      items: [
        { icon: ScanLine, label: 'Receipt Scan Settings', to: '/scan-receipt' },
        { icon: Sparkles, label: 'Auto Categorization' },
        { icon: Sparkles, label: 'AI Confidence Review' },
        { icon: Database, label: 'Receipt Storage' },
      ],
    },
    {
      title: 'Deals',
      items: [
        { icon: Gift, label: 'Deal Watchlist', to: '/deal-watchlist' },
        { icon: BarChart3, label: "Today's Deal Report", to: '/todays-deal-report' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { icon: BarChart3, label: 'Default Report View', to: '/reports' },
        { icon: FileText, label: 'Export Reports', soon: true },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: Bell, label: 'Budget Alerts' },
        { icon: Bell, label: 'Weekly / Monthly Summary' },
        { icon: Bell, label: 'Receipt Processing Alerts' },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: ShieldCheck, label: 'Face ID / App Lock' },
        { icon: ShieldCheck, label: 'Data Privacy' },
        { icon: Trash2, label: 'Delete Account', danger: true },
      ],
    },
    {
      title: 'Data & Backup',
      items: [
        { icon: Database, label: 'Backup', soon: true },
        { icon: Database, label: 'Export Data', soon: true },
        { icon: Database, label: 'Import Data', soon: true },
        { icon: Trash2, label: 'Reset Demo Data', action: () => resetData(), danger: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: LifeBuoy, label: 'Help Center' },
        { icon: Mail, label: 'Contact Support' },
        { icon: FileText, label: 'Terms & Privacy Policy' },
      ],
    },
  ]

  return (
    <AppShell showBottomNav topBar={<TopBar title="Settings" showBack />}>
      {/* Profile header → account & profile settings */}
      <button onClick={() => navigate('/account-settings')} className="w-full text-left">
        <Card className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primarySoft text-2xl">
            {isImage(userProfile.avatar) ? (
              <img src={userProfile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              userProfile.avatar || '🧑'
            )}
          </div>
          <div className="flex-1">
            <p className="text-[17px] font-extrabold text-ink">{userProfile.name || 'Alex Johnson'}</p>
            <p className="text-[13px] text-muted">{userProfile.email || 'dev@mjproductions.app'}</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </Card>
      </button>

      {sections.map((section) => (
        <div key={section.title} className="mt-5">
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">{section.title}</h2>
          <Card className="divide-y divide-line/70 px-4 py-0">
            {section.items.map((it) => {
              const Icon = it.icon
              return (
                <button
                  key={it.label}
                  onClick={() => (it.action ? it.action() : it.to ? navigate(it.to) : undefined)}
                  className="flex w-full items-center gap-3 py-3.5 text-left active:bg-surfaceSoft"
                >
                  <Icon size={20} className={it.danger ? 'text-red' : 'text-muted'} />
                  <span className={`flex-1 text-[15px] font-semibold ${it.danger ? 'text-red' : 'text-ink'}`}>{it.label}</span>
                  {it.soon && <span className="rounded-pill bg-line/50 px-2 py-0.5 text-[11px] font-bold text-muted">Later</span>}
                  <ChevronRight size={18} className="text-muted" />
                </button>
              )
            })}
          </Card>
        </div>
      ))}

      <button
        onClick={() => navigate('/login')}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-input border border-red/40 py-4 text-[16px] font-bold text-red active:bg-redSoft"
      >
        <LogOut size={20} /> Logout
      </button>

      <p className="mt-4 text-center text-[12px] text-muted">Budgii v1.0.0</p>
    </AppShell>
  )
}
