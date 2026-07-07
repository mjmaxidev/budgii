import { useEffect, useState } from 'react'
import { apiBlob } from '@/api/client'
import { isApiEnabled } from '@/api/config'

export function useUserAvatarUrl(avatar?: string | null): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!avatar || !isApiEnabled() || !avatar.startsWith('/users/me/avatar')) {
      setBlobUrl(undefined)
      return
    }

    let active = true
    let nextUrl: string | undefined

    void apiBlob(avatar)
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
  }, [avatar])

  return blobUrl || avatar || undefined
}
