import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { BudgiiLottie } from '@/components/motion/BudgiiLottie'
import successCheck from '@/assets/lottie/success-check.json'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { formatDate } from '@/utils/dates'
import { useLookups } from '@/store/lookups'
import type { Expense } from '@/types'

type TransactionConfirmState = {
  transaction: Partial<Expense> & { merchant: string; amount: number; categoryId: string; date: string }
}

export function TransactionConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as TransactionConfirmState | null
  const { category } = useLookups()

  if (!state?.transaction) {
    return (
      <AppShell>
        <p className="mt-10 text-center text-muted">Transaction data not found.</p>
      </AppShell>
    )
  }

  const { merchant, amount, categoryId, date } = state.transaction
  const cat = category(categoryId)

  function handleBackHome() {
    navigate('/home', { replace: true })
  }

  function handleAddAnother() {
    navigate('/add-expense-choice', { replace: true })
  }

  return (
    <Modal
      open={true}
      onClose={handleBackHome}
      variant="center"
    >
      {/* Success icon */}
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-greenSoft p-2">
          <BudgiiLottie
            animationData={successCheck}
            loop={false}
            className="h-24 w-24"
            ariaLabel="Success"
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-center text-[20px] font-extrabold text-ink mb-1">
        Transaction Confirmed
      </h2>
      <p className="text-center text-[14px] text-muted mb-6">
        Your expense has been saved
      </p>

      {/* Transaction details card */}
      <Card className="mb-6 p-4 space-y-4">
        {/* Merchant */}
        <div>
          <p className="text-[13px] text-muted mb-1">Merchant</p>
          <p className="text-[16px] font-bold text-ink">{merchant}</p>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[13px] text-muted mb-1">Amount</p>
            <MoneyText
              amount={amount}
              className="text-[24px] font-extrabold text-primary"
            />
          </div>
          {cat && (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[13px] text-muted mb-1">Category</p>
                <p className="text-[14px] font-semibold text-ink">{cat.name}</p>
              </div>
              <CategoryIcon icon={cat.icon} color={cat.color} size={32} />
            </div>
          )}
        </div>

        {/* Date */}
        <div className="pt-2 border-t border-line/50">
          <p className="text-[13px] text-muted mb-1">Date</p>
          <p className="text-[15px] font-semibold text-ink">{formatDate(date)}</p>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAddAnother}
          className="w-full flex items-center justify-between min-h-[48px] px-4 py-3 rounded-input bg-primary text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
        >
          <span>Add Another</span>
          <ChevronRight size={20} />
        </button>
        <button
          onClick={handleBackHome}
          className="w-full min-h-[48px] px-4 py-3 rounded-input border-2 border-primary bg-surface font-semibold text-[15px] text-primary active:scale-[0.98] transition-transform"
        >
          Back Home
        </button>
      </div>
    </Modal>
  )
}
