import { Receipt as ReceiptIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type Props = {
  imageUrl?: string
  className?: string
  rounded?: string
}

/** Shows the receipt image preview, or a styled faux-receipt placeholder. */
export function ReceiptThumbnail({ imageUrl, className, rounded = 'rounded-2xl' }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Receipt"
        className={cn('object-cover', rounded, className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 bg-[#F6F1EA] text-muted',
        rounded,
        className,
      )}
    >
      <ReceiptIcon size={22} />
      <span className="text-[10px] font-semibold uppercase tracking-wide">Receipt</span>
    </div>
  )
}
