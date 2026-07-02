export type MemberAccessRole = 'admin' | 'editor' | 'viewer'
export type EditorLevel = 'full' | 'standard' | 'limited'

export const MEMBER_ACCESS_ROLES: MemberAccessRole[] = ['admin', 'editor', 'viewer']

export const EDITOR_LEVELS: EditorLevel[] = ['full', 'standard', 'limited']

export const ACCESS_ROLE_LABELS: Record<MemberAccessRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export const EDITOR_LEVEL_LABELS: Record<EditorLevel, string> = {
  full: 'Full',
  standard: 'Standard',
  limited: 'Limited',
}

export const EDITOR_LEVEL_DESCRIPTIONS: Record<EditorLevel, string> = {
  full: 'Edit budget, categories, and all transactions',
  standard: 'Add and edit expenses, receipts, and lists',
  limited: 'Add expenses only',
}

export function formatMemberAccessLabel(
  accessRole: MemberAccessRole,
  editorLevel?: EditorLevel,
): string {
  if (accessRole === 'editor' && editorLevel) {
    return `Editor · ${EDITOR_LEVEL_LABELS[editorLevel]}`
  }
  return ACCESS_ROLE_LABELS[accessRole]
}

export function defaultEditorLevel(): EditorLevel {
  return 'standard'
}

export function normalizeEditorLevel(
  accessRole: MemberAccessRole,
  editorLevel?: EditorLevel | null,
): EditorLevel | undefined {
  if (accessRole !== 'editor') return undefined
  return editorLevel ?? defaultEditorLevel()
}
