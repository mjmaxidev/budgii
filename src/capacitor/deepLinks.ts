import { App, type URLOpenListenerEvent } from '@capacitor/app'
import { buildFamilyInviteAppPath } from '@/utils/familyInvite'

const JOIN_HOST = 'budgii.app'

function parseJoinDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (host !== JOIN_HOST && !host.endsWith(`.${JOIN_HOST}`)) return null

    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    if (path !== '/join') return null

    const code = parsed.searchParams.get('code')
    if (!code) return null

    return buildFamilyInviteAppPath(code)
  } catch {
    return null
  }
}

export function initDeepLinks(navigate: (path: string) => void) {
  void App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const path = parseJoinDeepLink(event.url)
    if (path) navigate(path)
  })

  void App.getLaunchUrl().then((result) => {
    if (!result?.url) return
    const path = parseJoinDeepLink(result.url)
    if (path) navigate(path)
  })
}
