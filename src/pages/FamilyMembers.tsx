import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Info, Tag, Wand2, Users, Trash2, Link as LinkIcon, Shield, Mail } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { MemberAccessPicker } from '@/components/family/MemberAccessPicker'
import { useStore } from '@/store/appStore'
import { withFrom } from '@/utils/navigation'
import type { EditorLevel, FamilyMember, MemberAccessRole } from '@/types'
import { defaultEditorLevel, formatMemberAccessLabel } from '@/utils/memberAccess'
import { isValidInviteEmail } from '@/utils/familyInvite'

const AVATARS = ['👩', '👨', '👧', '👦', '🧒', '👶', '🧑', '🧓']

function roleBadgeClass(role: MemberAccessRole) {
  if (role === 'admin') return 'bg-redSoft text-red'
  if (role === 'editor') return 'bg-blue-50 text-blue-700'
  return 'bg-line/50 text-muted'
}

export function FamilyMembers() {
  const navigate = useNavigate()
  const members = useStore((s) => s.familyMembers)
  const addFamilyMember = useStore((s) => s.addFamilyMember)
  const updateFamilyMember = useStore((s) => s.updateFamilyMember)
  const deleteFamilyMember = useStore((s) => s.deleteFamilyMember)
  const createFamilyInvite = useStore((s) => s.createFamilyInvite)
  const sendFamilyInvite = useStore((s) => s.sendFamilyInvite)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const [edit, setEdit] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[6])
  const [hasAppAccess, setHasAppAccess] = useState(false)
  const [accessRole, setAccessRole] = useState<MemberAccessRole>('viewer')
  const [editorLevel, setEditorLevel] = useState<EditorLevel>(defaultEditorLevel())
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteEmailError, setInviteEmailError] = useState('')

  const editingMember = editingId ? members.find((m) => m.id === editingId) : undefined
  const trimmedInviteEmail = inviteEmail.trim()
  const willSendInvite = hasAppAccess && trimmedInviteEmail.length > 0

  function resetForm() {
    setName('')
    setRelationship('')
    setAvatar(AVATARS[6])
    setHasAppAccess(false)
    setAccessRole('viewer')
    setEditorLevel(defaultEditorLevel())
    setInviteEmail('')
    setInviteEmailError('')
    setEditingId(null)
  }

  function openAdd() {
    resetForm()
    setModal('add')
  }

  function openEdit(member: FamilyMember) {
    setEditingId(member.id)
    setName(member.name)
    setRelationship(member.relationship)
    setAvatar(member.avatar)
    setHasAppAccess(!!member.hasAppAccess)
    setAccessRole(member.accessRole ?? 'viewer')
    setEditorLevel(member.editorLevel ?? defaultEditorLevel())
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    resetForm()
  }

  function saveAdd() {
    if (!name.trim()) return

    if (trimmedInviteEmail) {
      if (!hasAppAccess) {
        setInviteEmailError('Turn on app access to send an invite.')
        return
      }
      if (!isValidInviteEmail(trimmedInviteEmail)) {
        setInviteEmailError('Enter a valid email address.')
        return
      }
    }

    addFamilyMember({
      name: name.trim(),
      relationship: relationship.trim() || 'Family',
      avatar,
      hasAppAccess,
      accessRole: hasAppAccess ? accessRole : undefined,
      editorLevel: hasAppAccess && accessRole === 'editor' ? editorLevel : undefined,
    })

    if (hasAppAccess && trimmedInviteEmail) {
      const code = createFamilyInvite(accessRole, editorLevel)
      sendFamilyInvite(code, trimmedInviteEmail)
    }

    closeModal()
  }

  function saveEdit() {
    if (!editingId || !name.trim()) return
    const patch: Partial<FamilyMember> = {
      name: name.trim(),
      relationship: relationship.trim() || 'Family',
      avatar,
      hasAppAccess: editingMember?.isAccountHolder ? true : hasAppAccess,
    }
    if (hasAppAccess || editingMember?.isAccountHolder) {
      patch.accessRole = editingMember?.isAccountHolder ? 'admin' : accessRole
      patch.editorLevel = accessRole === 'editor' ? editorLevel : undefined
    }
    updateFamilyMember(editingId, patch)
    closeModal()
  }

  return (
    <AppShell topBar={<TopBar title="Family Members" showBack />}>
      <p className="mb-4 text-center text-[15px] text-muted">Assign expenses to each family member.</p>

      <ActionButton onClick={() => navigate('/family-invitation', withFrom('/family-members'))} className="mb-4">
        <LinkIcon size={18} /> Generate Invitation Link
      </ActionButton>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-ink">Household Members</h2>
        <button onClick={() => setEdit((v) => !v)} className="text-[15px] font-bold text-primary">
          {edit ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {members.map((m) => (
          <Card
            key={m.id}
            className={`relative flex items-center gap-3 py-3 ${edit ? 'cursor-pointer active:bg-surfaceSoft' : ''}`}
            onClick={edit ? () => openEdit(m) : undefined}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surfaceSoft text-2xl">{m.avatar}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold text-ink">{m.name}</p>
              <p className="truncate text-[13px] text-muted">{m.relationship}</p>
              {m.hasAppAccess && m.accessRole ? (
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass(m.accessRole)}`}
                >
                  {m.isAccountHolder && <Shield size={10} />}
                  {formatMemberAccessLabel(m.accessRole, m.editorLevel)}
                </span>
              ) : (
                <span className="mt-1 inline-block rounded-pill bg-greenSoft px-2 py-0.5 text-[11px] font-bold text-green">
                  {m.isDefault ? 'Default tag' : 'Tag only'}
                </span>
              )}
            </div>
            {edit && !m.isAccountHolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFamilyMember(m.id)
                }}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red text-white"
              >
                <Trash2 size={13} />
              </button>
            )}
          </Card>
        ))}
        <button
          onClick={openAdd}
          className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary/40 py-5 text-primary active:bg-primarySoft"
        >
          <Plus size={26} />
          <span className="text-[14px] font-bold">Add Member</span>
        </button>
      </div>

      <Card className="mt-4 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Info size={18} />
        </div>
        <div>
          <p className="text-[15px] font-bold text-ink">How it works</p>
          <p className="text-[13px] leading-snug text-muted">
            Tag-only members are for expense labels. Members with app access can sign in as viewer, editor, or admin.
            The account creator is always admin.
          </p>
        </div>
      </Card>

      <h2 className="mt-6 text-[17px] font-extrabold text-ink">Member Tag Settings</h2>
      <Card className="mt-2 space-y-2">
        <ToggleRow
          icon={<Tag size={18} className="text-green" />}
          title="Use members as expense tags"
          description="Show members when adding expenses."
          checked={settings.useMembersAsTags}
          onChange={(v) => updateSettings({ useMembersAsTags: v })}
        />
        <div className="h-px bg-line/70" />
        <ToggleRow
          icon={<Wand2 size={18} className="text-green" />}
          title="Suggest member based on receipt history"
          description="We'll suggest the best match automatically."
          checked={settings.suggestMemberFromHistory}
          onChange={(v) => updateSettings({ suggestMemberFromHistory: v })}
        />
      </Card>

      <Card className="mt-4">
        <p className="mb-2 text-[15px] font-bold text-ink">Example Tags</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip key={m.id} color="#FB8500">
              {m.name}
            </Chip>
          ))}
          <button onClick={openAdd} className="inline-flex items-center gap-1 rounded-pill border-2 border-dashed border-line px-3 py-1.5 text-[13px] font-bold text-muted">
            <Plus size={14} /> Add
          </button>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-[14px] text-muted">
        <Users size={18} className="text-green" /> Invite members to grant app access
      </div>

      <ActionButton className="mt-4" onClick={() => navigate('/settings')}>
        Done
      </ActionButton>

      <Modal open={modal === 'add'} onClose={closeModal} title="Add Member">
        <MemberFormFields
          name={name}
          setName={setName}
          relationship={relationship}
          setRelationship={setRelationship}
          avatar={avatar}
          setAvatar={setAvatar}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteEmailError={inviteEmailError}
          onInviteEmailChange={() => {
            if (inviteEmailError) setInviteEmailError('')
          }}
        />
        <div className="mt-4">
          <ToggleRow
            title="Can access the app"
            description="Allow this member to sign in and use the household."
            checked={hasAppAccess}
            onChange={setHasAppAccess}
          />
        </div>
        {hasAppAccess && (
          <div className="mt-4">
            <MemberAccessPicker
              accessRole={accessRole}
              editorLevel={editorLevel}
              onAccessRoleChange={setAccessRole}
              onEditorLevelChange={setEditorLevel}
            />
          </div>
        )}
        <ActionButton className="mt-5" onClick={saveAdd}>
          {willSendInvite ? 'Add Member & Send Invite' : 'Add Member'}
        </ActionButton>
      </Modal>

      <Modal open={modal === 'edit'} onClose={closeModal} title="Edit Member">
        <MemberFormFields
          name={name}
          setName={setName}
          relationship={relationship}
          setRelationship={setRelationship}
          avatar={avatar}
          setAvatar={setAvatar}
        />
        {editingMember?.isAccountHolder ? (
          <Card className="mt-4 bg-redSoft/40">
            <p className="text-[13px] font-bold text-ink">Household admin</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">
              This is the account creator and always has full admin access.
            </p>
          </Card>
        ) : (
          <>
            <div className="mt-4">
              <ToggleRow
                title="Can access the app"
                description="Allow this member to sign in and use the household."
                checked={hasAppAccess}
                onChange={setHasAppAccess}
              />
            </div>
            {hasAppAccess && (
              <div className="mt-4">
                <MemberAccessPicker
                  accessRole={accessRole}
                  editorLevel={editorLevel}
                  onAccessRoleChange={setAccessRole}
                  onEditorLevelChange={setEditorLevel}
                />
              </div>
            )}
          </>
        )}
        <ActionButton className="mt-5" onClick={saveEdit}>
          Save Changes
        </ActionButton>
      </Modal>
    </AppShell>
  )
}

function MemberFormFields({
  name,
  setName,
  relationship,
  setRelationship,
  avatar,
  setAvatar,
  inviteEmail,
  setInviteEmail,
  inviteEmailError,
  onInviteEmailChange,
}: {
  name: string
  setName: (v: string) => void
  relationship: string
  setRelationship: (v: string) => void
  avatar: string
  setAvatar: (v: string) => void
  inviteEmail?: string
  setInviteEmail?: (v: string) => void
  inviteEmailError?: string
  onInviteEmailChange?: () => void
}) {
  return (
    <>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
      />
      <input
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
        placeholder="Relationship (e.g. Child 4)"
        className="mt-3 w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
      />
      {setInviteEmail !== undefined && (
        <div className="mt-3">
          <FormField
            type="email"
            label="Email (optional)"
            placeholder="family@example.com"
            leftIcon={<Mail size={18} />}
            value={inviteEmail ?? ''}
            onChange={(e) => {
              setInviteEmail(e.target.value)
              onInviteEmailChange?.()
            }}
            autoComplete="email"
            inputMode="email"
          />
          <p className="mt-1.5 text-[12px] leading-snug text-muted">
            Send an invite to download Budgii and join your household with the access level you choose below.
          </p>
          {inviteEmailError && (
            <p className="mt-1.5 text-[12px] font-semibold text-red">{inviteEmailError}</p>
          )}
        </div>
      )}
      <p className="mb-2 mt-4 text-[13px] font-semibold text-muted">Avatar</p>
      <div className="grid grid-cols-8 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className={`flex h-10 items-center justify-center rounded-xl border text-xl ${
              avatar === a ? 'border-primary bg-primarySoft' : 'border-line'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </>
  )
}
