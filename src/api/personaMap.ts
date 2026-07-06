import type { PersonaResponse } from '@/api/types'
import type { FamilyMember } from '@/types'

export function personasToFamilyMembers(
  personas: PersonaResponse[],
  householdIsAccountHolder?: boolean,
): FamilyMember[] {
  return personas.map((persona) => {
    const isAccountHolder = Boolean(householdIsAccountHolder && persona.has_app_access)
    return {
      id: persona.id,
      name: persona.name,
      relationship: persona.relationship,
      avatar: persona.avatar,
      active: persona.active,
      isDefault: persona.is_default,
      isAccountHolder,
      hasAppAccess: persona.has_app_access,
      accessRole: isAccountHolder ? 'admin' : (persona.access_role ?? undefined),
      editorLevel: persona.editor_level ?? undefined,
    }
  })
}
