import { useNavigate } from 'react-router-dom'
import { withFrom } from '@/utils/navigation'
import { Camera, ChevronRight, PenLine, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StaggerIn } from '@/components/motion/StaggerIn'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'

export function AddExpenseChoice() {
  const navigate = useNavigate()

  return (
    <AppShell topBar={<TopBar title="Add Expense" showBack />}>
      <p className="mb-5 text-center text-[16px] leading-snug text-muted">
        How would you like to add this expense?
      </p>

      <StaggerIn className="space-y-3">
        <button type="button" onClick={() => navigate('/add-expense', withFrom('/add-expense-choice'))} className="w-full text-left">
          <Card className="flex items-center gap-4 py-4 active:bg-surfaceSoft">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primarySoft text-primary">
              <PenLine size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-ink">Enter Manually</span>
              <span className="mt-0.5 block text-[14px] text-muted">
                Type the amount, merchant, category, and tags yourself.
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-muted" />
          </Card>
        </button>

        <button type="button" onClick={() => navigate('/scan-receipt', withFrom('/add-expense-choice'))} className="w-full text-left">
          <Card className="flex items-center gap-4 py-4 active:bg-surfaceSoft">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-greenSoft text-green">
              <Camera size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-ink">Scan Receipt or Invoice</span>
              <span className="mt-0.5 block text-[14px] text-muted">
                Take a photo and Budgii will extract items and auto-categorise them.
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-muted" />
          </Card>
        </button>
      </StaggerIn>

      <Card soft className="mt-5 flex items-start gap-3">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-green" />
        <p className="text-[14px] leading-snug text-muted">
          Receipt scanning uses AI to read totals, line items, and merchants — then suggests categories you can review before saving.
        </p>
      </Card>
    </AppShell>
  )
}
