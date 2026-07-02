import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { CategoryAddTile, CategoryCreateModal } from '@/components/finance/CategoryCreateModal'
import { TagCreateModal } from '@/components/finance/TagCreateModal'
import { useLookups } from '@/store/lookups'

type Props = {
  categoryId: string
  tagIds: string[]
  onCategoryChange: (id: string) => void
  onTagIdsChange: (ids: string[]) => void
}

export function ReceiptItemMetaFields({ categoryId, tagIds, onCategoryChange, onTagIdsChange }: Props) {
  const { categories, tags } = useLookups()
  const [categoryEditMode, setCategoryEditMode] = useState(false)
  const [tagEditMode, setTagEditMode] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>()
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [editTagId, setEditTagId] = useState<string | undefined>()

  function openCreateCategory() {
    setEditCategoryId(undefined)
    setCategoryModalOpen(true)
  }

  function openEditCategory(id: string) {
    setEditCategoryId(id)
    setCategoryModalOpen(true)
  }

  function openCreateTag() {
    setEditTagId(undefined)
    setTagModalOpen(true)
  }

  function openEditTag(id: string) {
    setEditTagId(id)
    setTagModalOpen(true)
  }

  function toggleTag(id: string) {
    onTagIdsChange(tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id])
  }

  return (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted">Category</span>
          <button
            type="button"
            onClick={() => setCategoryEditMode((v) => !v)}
            className="text-[13px] font-bold text-primary"
          >
            {categoryEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (categoryEditMode) {
                  openEditCategory(c.id)
                  return
                }
                onCategoryChange(c.id)
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 ${
                !categoryEditMode && categoryId === c.id ? 'border-primary bg-primarySoft' : 'border-line'
              } ${categoryEditMode ? 'ring-1 ring-primary/30' : ''}`}
            >
              <CategoryIcon icon={c.icon} color={c.color} size={32} />
              <span className="w-full truncate text-center text-[10px] font-semibold text-ink">{c.name}</span>
            </button>
          ))}
          <CategoryAddTile onClick={openCreateCategory} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted">Tags</span>
          <button
            type="button"
            onClick={() => setTagEditMode((v) => !v)}
            className="text-[13px] font-bold text-primary"
          >
            {tagEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Chip
              key={t.id}
              color={t.color}
              active={!tagEditMode && tagIds.includes(t.id)}
              onClick={() => {
                if (tagEditMode) {
                  openEditTag(t.id)
                  return
                }
                toggleTag(t.id)
              }}
            >
              {t.name}
            </Chip>
          ))}
          <button
            type="button"
            onClick={openCreateTag}
            className="inline-flex items-center gap-1 rounded-pill border-2 border-dashed border-line px-3 py-1.5 text-[13px] font-bold text-muted active:bg-surfaceSoft"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <CategoryCreateModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        editCategoryId={editCategoryId}
        onSaved={(id) => {
          onCategoryChange(id)
          setCategoryModalOpen(false)
          setCategoryEditMode(false)
        }}
      />

      <TagCreateModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        editTagId={editTagId}
        onSaved={(id) => {
          if (!editTagId && !tagIds.includes(id)) {
            onTagIdsChange([...tagIds, id])
          }
          setTagModalOpen(false)
          setTagEditMode(false)
        }}
      />
    </>
  )
}
