import { useEffect, useState } from 'react'
import { isApiEnabled } from '@/api/config'
import { getReceiptFile } from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'

type ReceiptImageInput = {
  receiptId?: string
  uploadId?: string
  imageUrl?: string
}

export function useReceiptImageUrl({ receiptId, uploadId, imageUrl }: ReceiptImageInput): string | undefined {
  const householdId = useAuthStore((s) => s.householdId)
  const [blobUrl, setBlobUrl] = useState<string | undefined>()

  useEffect(() => {
    if (imageUrl || !isApiEnabled() || !householdId || !receiptId || !uploadId) {
      setBlobUrl(undefined)
      return
    }

    let active = true
    let nextUrl: string | undefined

    void getReceiptFile(householdId, receiptId)
      .then((blob) => {
        if (!active) return
        nextUrl = URL.createObjectURL(blob)
        setBlobUrl(nextUrl)
      })
      .catch(() => {
        if (active) setBlobUrl(undefined)
      })

    return () => {
      active = false
      if (nextUrl) URL.revokeObjectURL(nextUrl)
    }
  }, [householdId, imageUrl, receiptId, uploadId])

  return imageUrl || blobUrl
}
