import { Receipt as ReceiptIcon } from 'lucide-react'
import { useReceiptImageUrl } from '@/hooks/useReceiptImageUrl'
import { cn } from '@/utils/cn'

type Props = {
  receiptId?: string
  uploadId?: string
  imageUrl?: string
  className?: string
  rounded?: string
}

/** Shows the receipt image preview, or a styled faux-receipt placeholder. */
export function ReceiptThumbnail({ receiptId, uploadId, imageUrl, className, rounded = 'rounded-2xl' }: Props) {
  const resolvedImageUrl = useReceiptImageUrl({ receiptId, uploadId, imageUrl })

  if (resolvedImageUrl) {
    return (
      <img
        src={resolvedImageUrl}
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
