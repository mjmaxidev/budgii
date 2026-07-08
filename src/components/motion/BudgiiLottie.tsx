import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/utils/cn'

type Props = {
  animationData: object
  className?: string
  loop?: boolean
  autoplay?: boolean
  ariaLabel?: string
}

export function BudgiiLottie({
  animationData,
  className,
  loop = true,
  autoplay = true,
  ariaLabel,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    if (reduced) {
      ref.current?.goToAndStop(0, true)
      return
    }
    if (autoplay) ref.current?.play()
  }, [autoplay, reduced])

  if (reduced) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
      >
        <div className="h-[55%] w-[55%] rounded-full bg-primary/20" />
      </div>
    )
  }

  return (
    <Lottie
      lottieRef={ref}
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={cn('h-full w-full', className)}
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      aria-label={ariaLabel}
    />
  )
}
