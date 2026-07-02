/** Public invite link scanned from the Family Invitation QR code. */
export function normalizeInviteCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase()
}

export function formatInviteCode(code: string) {
  const normalized = normalizeInviteCode(code)
  if (normalized.length <= 3) return normalized
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
}

export function buildFamilyInviteUrl(code: string) {
  const normalized = normalizeInviteCode(code)
  return `https://budgii.app/join?code=${encodeURIComponent(normalized)}`
}

/** In-app hash route for invite deep links inside Budgii. */
export function buildFamilyInviteAppPath(code: string) {
  const normalized = normalizeInviteCode(code)
  return `/join-family?code=${encodeURIComponent(normalized)}`
}
