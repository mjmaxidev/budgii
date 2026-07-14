import { Pencil } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import type { FamilyMember, IncomeItem, IncomeSource, OngoingIncome } from '@/types'

type Props = {
  sources: IncomeSource[]
  ongoingIncomes: OngoingIncome[]
  monthItems: IncomeItem[]
  members: FamilyMember[]
  onMemberSalary: (memberId: string) => void
}

export function IncomeBreakdowns({ sources, ongoingIncomes, monthItems, members, onMemberSalary }: Props) {
  return (
    <>
      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">By source</h2>
        <div className="grid grid-cols-2 gap-2">
          {sources.map((source) => {
            const ongoing = ongoingIncomes
              .filter((income) => income.enabled && income.sourceId === source.id)
              .reduce((sum, income) => sum + income.amount, 0)
            const manual = monthItems
              .filter((item) => item.sourceId === source.id)
              .reduce((sum, item) => sum + item.amount, 0)
            return (
              <Card key={source.id} className="flex flex-col items-center gap-1 py-3">
                <span className="mb-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                <span className="text-[12px] font-semibold text-muted">{source.name}</span>
                <MoneyText amount={ongoing + manual} className="text-[18px] font-bold text-ink" />
              </Card>
            )
          })}
        </div>
      </div>

      {members.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">By family member</h2>
          <div className="grid grid-cols-2 gap-2">
            {members.map((member) => {
              const ongoing = ongoingIncomes
                .filter((income) => income.enabled && income.memberId === member.id)
                .reduce((sum, income) => sum + income.amount, 0)
              const manual = monthItems
                .filter((item) => item.memberId === member.id)
                .reduce((sum, item) => sum + item.amount, 0)
              return (
                <Card key={member.id} className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onMemberSalary(member.id)}
                    className="flex w-full items-center gap-2 text-left active:opacity-70"
                  >
                    <span className="text-xl">{member.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{member.name}</p>
                      <MoneyText amount={ongoing + manual} className="text-[16px] font-bold text-green" />
                    </div>
                    <Pencil size={14} className="shrink-0 text-muted" />
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
