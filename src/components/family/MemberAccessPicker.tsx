import { Chip } from '@/components/ui/Chip'
import type { EditorLevel, MemberAccessRole } from '@/utils/memberAccess'
import {
  ACCESS_ROLE_LABELS,
  EDITOR_LEVEL_DESCRIPTIONS,
  EDITOR_LEVEL_LABELS,
  EDITOR_LEVELS,
  MEMBER_ACCESS_ROLES,
} from '@/utils/memberAccess'

type Props = {
  accessRole: MemberAccessRole
  editorLevel?: EditorLevel
  onAccessRoleChange: (role: MemberAccessRole) => void
  onEditorLevelChange: (level: EditorLevel) => void
  disableAdmin?: boolean
  allowAdmin?: boolean
}

export function MemberAccessPicker({
  accessRole,
  editorLevel = 'standard',
  onAccessRoleChange,
  onEditorLevelChange,
  disableAdmin = false,
  allowAdmin = false,
}: Props) {
  const roles = allowAdmin ? MEMBER_ACCESS_ROLES : MEMBER_ACCESS_ROLES.filter((r) => r !== 'admin')

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[13px] font-semibold text-muted">Access role</p>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const locked = role === 'admin' && disableAdmin
            return (
              <Chip
                key={role}
                color={role === 'admin' ? '#EF4444' : role === 'editor' ? '#2386F6' : '#6B7280'}
                active={accessRole === role}
                onClick={locked ? undefined : () => onAccessRoleChange(role)}
                className={locked ? 'opacity-50' : undefined}
              >
                {ACCESS_ROLE_LABELS[role]}
              </Chip>
            )
          })}
        </div>
      </div>

      {accessRole === 'editor' && (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-muted">Editor level</p>
          <div className="space-y-2">
            {EDITOR_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onEditorLevelChange(level)}
                className={`w-full rounded-input border px-4 py-3 text-left transition ${
                  editorLevel === level ? 'border-primary bg-primarySoft' : 'border-line bg-surface'
                }`}
              >
                <p className="text-[14px] font-bold text-ink">{EDITOR_LEVEL_LABELS[level]}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">
                  {EDITOR_LEVEL_DESCRIPTIONS[level]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {accessRole === 'viewer' && (
        <p className="text-[12px] leading-snug text-muted">
          Viewers can see household spending and reports but cannot add or edit transactions.
        </p>
      )}
    </div>
  )
}
