import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Info, Tag, Wand2, Users, Trash2, Link as LinkIcon, Shield, Mail, UserMinus } from 'lucide-react'
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
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { listHouseholdMembers, removeHouseholdMember, updateHouseholdMember } from '@/api/households'
import { createPersona, deletePersona, listPersonas, updatePersona } from '@/api/personas'
import { personasToFamilyMembers } from '@/api/personaMap'
import { withFrom } from '@/utils/navigation'
import type { EditorLevel, FamilyMember, MemberAccessRole } from '@/types'
import type { HouseholdMemberResponse } from '@/api/types'
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
  const householdId = useAuthStore((s) => s.householdId)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [edit, setEdit] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [memberModal, setMemberModal] = useState<HouseholdMemberResponse | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[6])
  const [hasAppAccess, setHasAppAccess] = useState(false)
  const [accessRole, setAccessRole] = useState<MemberAccessRole>('viewer')
  const [editorLevel, setEditorLevel] = useState<EditorLevel>(defaultEditorLevel())
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteEmailError, setInviteEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)
  const [appMembers, setAppMembers] = useState<HouseholdMemberResponse[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [memberSavingId, setMemberSavingId] = useState('')
  const [memberAccessRole, setMemberAccessRole] = useState<Exclude<MemberAccessRole, 'admin'>>('viewer')
  const [memberEditorLevel, setMemberEditorLevel] = useState<EditorLevel>(defaultEditorLevel())

  const editingMember = editingId ? members.find((m) => m.id === editingId) : undefined
  const trimmedInviteEmail = inviteEmail.trim()
  const willSendInvite = hasAppAccess && trimmedInviteEmail.length > 0
  const apiOn = isApiEnabled()

  function setApiMembersFromPersonas(personas: Awaited<ReturnType<typeof listPersonas>>['personas']) {
    const currentById = new Map(useStore.getState().familyMembers.map((m) => [m.id, m]))
    useStore.setState({
      familyMembers: personasToFamilyMembers(personas).map((member) => {
        const current = currentById.get(member.id)
        return {
          ...member,
          isAccountHolder: current?.isAccountHolder ?? member.isAccountHolder,
        }
      }),
    })
  }

  async function refreshApiMembers() {
    if (!householdId) return
    const { personas } = await listPersonas(householdId)
    setApiMembersFromPersonas(personas)
  }

  async function refreshHouseholdMembers() {
    if (!householdId) return
    setMembersLoading(true)
    setApiError('')
    try {
      const { members: nextMembers } = await listHouseholdMembers(householdId)
      setAppMembers(nextMembers)
    } catch (err) {
      setApiError(apiMessage(err, 'Could not load app access members.'))
    } finally {
      setMembersLoading(false)
    }
  }

  useEffect(() => {
    if (!apiOn || !householdId) {
      setAppMembers([])
      return
    }

    void refreshHouseholdMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn, householdId])

  function apiMessage(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback
  }

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

  function openMemberAccess(member: HouseholdMemberResponse) {
    if (member.is_account_holder || member.access_role === 'admin') return
    setMemberModal(member)
    setMemberAccessRole(member.access_role)
    setMemberEditorLevel(member.editor_level ?? defaultEditorLevel())
  }

  function closeMemberAccess() {
    setMemberModal(null)
    setMemberAccessRole('viewer')
    setMemberEditorLevel(defaultEditorLevel())
  }

  async function saveMemberAccess() {
    if (!apiOn || !householdId || !memberModal) return

    setApiError('')
    setMemberSavingId(memberModal.user_id)
    try {
      await updateHouseholdMember(householdId, memberModal.user_id, memberAccessRole, memberEditorLevel)
      await refreshHouseholdMembers()
      await refreshApiMembers()
      closeMemberAccess()
    } catch (err) {
      setApiError(apiMessage(err, 'Could not update member access.'))
    } finally {
      setMemberSavingId('')
    }
  }

  async function removeAppMember(member: HouseholdMemberResponse) {
    if (!apiOn || !householdId || member.is_account_holder || member.user_id === currentUserId) return

    const confirmed = window.confirm(`Remove ${member.name}'s app access?`)
    if (!confirmed) return

    setApiError('')
    setMemberSavingId(member.user_id)
    try {
      await removeHouseholdMember(householdId, member.user_id)
      await refreshHouseholdMembers()
      await refreshApiMembers()
    } catch (err) {
      setApiError(apiMessage(err, 'Could not remove member access.'))
    } finally {
      setMemberSavingId('')
    }
  }

  async function saveAdd() {
    if (!name.trim()) return

    setApiError('')
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

    if (apiOn) {
      if (!householdId) {
        setApiError('No household selected. Sign in or create a household first.')
        return
      }

      setSaving(true)
      try {
        await createPersona(householdId, {
          name: name.trim(),
          relationship: relationship.trim() || 'Family',
          avatar,
          active: true,
          is_default: false,
        })

        await refreshApiMembers()
        closeModal()
      } catch (err) {
        setApiError(apiMessage(err, 'Could not add member.'))
      } finally {
        setSaving(false)
      }
      return
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

  async function saveEdit() {
    if (!editingId || !name.trim()) return
    setApiError('')

    if (apiOn) {
      if (!householdId) {
        setApiError('No household selected. Sign in or create a household first.')
        return
      }

      setSaving(true)
      try {
        await updatePersona(householdId, editingId, {
          name: name.trim(),
          relationship: relationship.trim() || 'Family',
          avatar,
          active: editingMember?.active ?? true,
          is_default: editingMember?.isDefault ?? false,
        })
        await refreshApiMembers()
        closeModal()
      } catch (err) {
        setApiError(apiMessage(err, 'Could not update member.'))
      } finally {
        setSaving(false)
      }
      return
    }

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

  async function removeMember(member: FamilyMember) {
    setApiError('')
    if (apiOn) {
      if (!householdId) {
        setApiError('No household selected. Sign in or create a household first.')
        return
      }

      setSaving(true)
      try {
        await deletePersona(householdId, member.id)
        await refreshApiMembers()
      } catch (err) {
        setApiError(apiMessage(err, 'Could not delete member.'))
      } finally {
        setSaving(false)
      }
      return
    }

    deleteFamilyMember(member.id)
  }

  return (
    <AppShell topBar={<TopBar title="Family Members" showBack />}>
      <p className="mb-4 text-center text-[15px] text-muted">Assign expenses to each family member.</p>

      {apiError && (
        <p className="mb-4 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
          {apiError}
        </p>
      )}

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
                  void removeMember(m)
                }}
                disabled={saving}
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

      {apiOn && (
        <>
          <h2 className="mt-6 text-[17px] font-extrabold text-ink">App Access</h2>
          <Card className="mt-2 space-y-3">
            {membersLoading && appMembers.length === 0 ? (
              <p className="text-[13px] text-muted">Loading app members...</p>
            ) : appMembers.length === 0 ? (
              <p className="text-[13px] text-muted">No app-access members yet.</p>
            ) : (
              appMembers.map((member) => {
                const locked = member.is_account_holder || member.access_role === 'admin'
                const canRemove = !member.is_account_holder && member.user_id !== currentUserId
                return (
                  <div key={member.user_id} className="flex items-center gap-3 rounded-input bg-surfaceSoft px-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl">
                      {member.avatar || '👤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-extrabold text-ink">{member.name}</p>
                      <p className="truncate text-[12px] text-muted">{member.email}</p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass(member.access_role)}`}
                      >
                        {member.is_account_holder && <Shield size={10} />}
                        {formatMemberAccessLabel(member.access_role, member.editor_level ?? undefined)}
                      </span>
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => openMemberAccess(member)}
                        disabled={memberSavingId === member.user_id}
                        className="rounded-pill bg-primarySoft px-3 py-1.5 text-[12px] font-bold text-primary disabled:opacity-50"
                      >
                        Role
                      </button>
                    )}
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => void removeAppMember(member)}
                        disabled={memberSavingId === member.user_id}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-redSoft text-red disabled:opacity-50"
                        aria-label="Remove app access"
                      >
                        <UserMinus size={15} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </Card>
        </>
      )}

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
          inviteEmail={apiOn ? undefined : inviteEmail}
          setInviteEmail={apiOn ? undefined : setInviteEmail}
          inviteEmailError={apiOn ? undefined : inviteEmailError}
          onInviteEmailChange={
            apiOn
              ? undefined
              : () => {
                  if (inviteEmailError) setInviteEmailError('')
                }
          }
        />
        {apiOn ? (
          <Card className="mt-4 bg-primarySoft/50">
            <p className="text-[13px] font-bold text-ink">Tag-only member</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">
              This creates an expense tag in your household. Use Generate Invitation Link to grant app access.
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
        <ActionButton className="mt-5" onClick={() => void saveAdd()} disabled={saving}>
          {saving ? 'Saving…' : apiOn ? 'Add Tag Member' : willSendInvite ? 'Add Member & Send Invite' : 'Add Member'}
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
        ) : apiOn ? (
          <Card className="mt-4 bg-primarySoft/50">
            <p className="text-[13px] font-bold text-ink">App access is invite-based</p>
            <p className="mt-1 text-[12px] leading-snug text-muted">
              Edit this member's tag details here. Use Generate Invitation Link to grant app access.
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
        <ActionButton className="mt-5" onClick={() => void saveEdit()} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </ActionButton>
      </Modal>

      <Modal open={!!memberModal} onClose={closeMemberAccess} title="Member Access">
        {memberModal && (
          <>
            <div className="mb-4 rounded-input bg-surfaceSoft px-4 py-3">
              <p className="truncate text-[14px] font-extrabold text-ink">{memberModal.name}</p>
              <p className="truncate text-[12px] text-muted">{memberModal.email}</p>
            </div>
            <MemberAccessPicker
              accessRole={memberAccessRole}
              editorLevel={memberEditorLevel}
              onAccessRoleChange={(role) => {
                if (role !== 'admin') setMemberAccessRole(role)
              }}
              onEditorLevelChange={setMemberEditorLevel}
            />
            <ActionButton
              className="mt-5"
              onClick={() => void saveMemberAccess()}
              disabled={memberSavingId === memberModal.user_id}
            >
              {memberSavingId === memberModal.user_id ? 'Saving…' : 'Save Access'}
            </ActionButton>
          </>
        )}
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
