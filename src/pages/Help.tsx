import { useState } from 'react'
import {
  ChevronDown,
  Plus,
  ScanLine,
  Wallet,
  Users,
  Bell,
  MessageCircle,
  CreditCard,
  Zap,
  Lock,
  BarChart3,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'

interface FAQItem {
  id: string
  icon: typeof Plus
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    id: 'add-expense',
    icon: Plus,
    question: 'How do I add an expense?',
    answer:
      'Tap the "+" button to choose how to add an expense — enter it manually or scan a receipt. For manual entry, fill in the amount, category, tags, and who paid, then tap Save. For receipts, take a photo and Budgii will extract items and suggest categories for you to review.',
  },
  {
    id: 'scan-receipt',
    icon: ScanLine,
    question: 'How do I scan a receipt?',
    answer:
      'Go to Scan a Receipt, capture or upload the receipt image, and Budgii will extract the merchant, total, and line items. Review or edit the extracted items, then tap Confirm All Items to add them to your expenses. If OCR fails or looks wrong, use Re-analyze Receipt from the results page.',
  },
  {
    id: 'set-budget',
    icon: Wallet,
    question: 'How do I set my budget?',
    answer:
      'Go to Settings > Budget Setting. Enter your total budget limit, set a warning threshold for alerts, and optionally allocate amounts to specific categories. Choose whether you want monthly, weekly, or daily budget periods.',
  },
  {
    id: 'invite-family',
    icon: Users,
    question: 'How do I invite family members?',
    answer:
      'Ask your household admin for an invite code from Family Members → Generate Invitation Link. On your device, open Budgii, tap "Have an invite code?" on the login screen (or go to Join Family), enter the code and your name, then tap Join Household.',
  },
  {
    id: 'budget-alerts',
    icon: Bell,
    question: 'How do I set up budget alerts?',
    answer:
      'Go to Settings > Spending Alerts. Turn on notifications, choose fixed amount or percentage alerts, then create alerts for the categories you want to watch. Budgii checks those alerts against your current month spending.',
  },
  {
    id: 'categories',
    icon: CreditCard,
    question: 'Can I customize categories?',
    answer:
      'Yes! Go to Settings > Categories & Tags to create, edit, or delete expense categories. You can also assign custom icons and colors to each category to match your preferences and make tracking more visual.',
  },
  {
    id: 'view-reports',
    icon: BarChart3,
    question: 'How do I view spending reports?',
    answer:
      'Navigate to the Reports page to see your spending breakdown by category, spending trends over time, and budget progress. You can filter by date range and category. Reports update in real-time as you add expenses.',
  },
  {
    id: 'deals',
    icon: Zap,
    question: 'What are the Deals features?',
    answer:
      'Deals help you save money! View today\'s deals in the "Today\'s Deal Report," browse all available deals, or add items to your shopping watchlist. Receive alerts when watched items go on sale.',
  },
  {
    id: 'security',
    icon: Lock,
    question: 'How secure is my data?',
    answer:
      'Budgii uses account authentication for backend sync and keeps the app PIN lock local to your device. Household access is permission-based, so admins can control who can view or edit household data.',
  },
  {
    id: 'export-data',
    icon: MessageCircle,
    question: 'Can I export or backup my data?',
    answer:
      'Yes. Go to Settings > Export Data to download transactions as CSV, a current-month HTML report, or a JSON backup of the app data currently loaded on your device.',
  },
]

export function Help() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Help & FAQ" showBack />}>
      <div className="mb-3 text-center">
        <p className="text-[15px] font-semibold text-ink">Frequently Asked Questions</p>
        <p className="text-[13px] text-muted">Find answers to common questions about using Budgii</p>
      </div>

      <div className="space-y-2">
        {faqItems.map((item) => (
          <FAQAccordion
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => toggleFAQ(item.id)}
          />
        ))}
      </div>

      {/* Contact support section */}
      <Card className="mt-6 bg-primarySoft">
        <div className="flex items-start gap-3">
          <MessageCircle size={24} className="mt-0.5 text-primary" />
          <div>
            <p className="text-[15px] font-bold text-primary">Still have questions?</p>
            <p className="text-[13px] text-primary/80">
              Reach out to our support team at{' '}
              <a href="mailto:support@budgii.app" className="font-semibold underline">
                support@budgii.app
              </a>
            </p>
          </div>
        </div>
      </Card>

      <div className="h-4" />
    </AppShell>
  )
}

function FAQAccordion({
  item,
  isExpanded,
  onToggle,
}: {
  item: FAQItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = item.icon

  return (
    <Card className="overflow-hidden p-0 transition-all duration-200">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left active:bg-surfaceSoft"
        aria-expanded={isExpanded}
      >
        {/* Icon with background */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primarySoft flex-shrink-0 mt-1">
          <Icon size={20} className="text-primary" />
        </div>

        {/* Question text + chevron */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-ink">{item.question}</p>
        </div>

        {/* Chevron indicator */}
        <ChevronDown
          size={20}
          className={`text-muted transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded answer */}
      {isExpanded && (
        <div className="border-t border-line/50 bg-surfaceSoft px-4 py-3">
          <p className="text-[14px] leading-relaxed text-ink">{item.answer}</p>
        </div>
      )}
    </Card>
  )
}
