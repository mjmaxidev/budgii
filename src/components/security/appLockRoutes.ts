const EXEMPT_PATHS = ['/login', '/onboarding', '/verification']

export function isProtectedPath(pathname: string): boolean {
  if (pathname === '/') return false
  return !EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isAppLockExemptPath(pathname: string): boolean {
  return !isProtectedPath(pathname)
}
