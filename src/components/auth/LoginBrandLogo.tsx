import budgiiLoginText from '@/assets/budgii-login-text.png'
import budgiiLoginWallet from '@/assets/budgii-login-wallet.png'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/utils/cn'

export function LoginBrandLogo() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="mx-auto flex w-[min(280px,85vw)] flex-col items-center">
      <div
        className={cn(
          '-mb-14 flex w-[min(240px,78vw)] items-end justify-center',
          !reduced && 'motion-wallet-bounce',
        )}
      >
        <img
          src={budgiiLoginWallet}
          alt=""
          aria-hidden
          className="max-h-[150px] w-full object-contain object-bottom"
        />
      </div>
      <img
        src={budgiiLoginText}
        alt="Budgii — Smart Budgets. Better Futures."
        className="-mt-6 -mb-12 w-full object-contain object-top"
      />
    </div>
  )
}
