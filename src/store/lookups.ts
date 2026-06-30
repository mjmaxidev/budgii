import { useMemo } from 'react'
import type { Category, FamilyMember, Tag } from '@/types'
import { useStore } from './appStore'

export function useLookups() {
  const categories = useStore((s) => s.categories)
  const tags = useStore((s) => s.tags)
  const familyMembers = useStore((s) => s.familyMembers)

  return useMemo(() => {
    const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]))
    const tagMap = new Map<string, Tag>(tags.map((t) => [t.id, t]))
    const memberMap = new Map<string, FamilyMember>(familyMembers.map((m) => [m.id, m]))
    return {
      categories,
      tags,
      familyMembers,
      category: (id?: string) => (id ? catMap.get(id) : undefined),
      tag: (id?: string) => (id ? tagMap.get(id) : undefined),
      member: (id?: string) => (id ? memberMap.get(id) : undefined),
    }
  }, [categories, tags, familyMembers])
}
