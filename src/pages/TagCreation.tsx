import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { ColorPickerField } from '@/components/ui/ColorPickerField'
import { TAG_COLOR_CHOICES } from '@/constants/tagChoices'
import { useStore } from '@/store/appStore'

export function TagCreation() {
  const navigate = useNavigate()
  const addTag = useStore((s) => s.addTag)

  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLOR_CHOICES[0])
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    if (!tagName.trim()) {
      alert('Please enter a tag name')
      return
    }

    addTag(tagName, selectedColor)
    setIsSaved(true)

    setTimeout(() => {
      navigate('/categories-tags')
    }, 1000)
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Create Tag" showBack />}>
      <div className="mb-6 text-center">
        <p className="text-[15px] font-semibold text-ink">Create a new tag</p>
        <p className="mt-1 text-[13px] text-muted">Tags help you organize and filter your transactions</p>
      </div>

      <Card className="mb-6 space-y-5">
        <FormField
          label="Tag Name"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="e.g., Shopping, Work, Groceries"
        />

        <ColorPickerField
          value={selectedColor}
          onChange={setSelectedColor}
          presets={TAG_COLOR_CHOICES}
          label="Color"
          swatchSize="md"
        />

        {tagName && (
          <div>
            <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">Preview</p>
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"
              style={{ backgroundColor: selectedColor }}
            >
              {tagName}
            </span>
          </div>
        )}
      </Card>

      <div className="space-y-2.5">
        <ActionButton variant="primary" onClick={handleSave} className={isSaved ? 'bg-green' : ''}>
          {isSaved ? '✓ Tag Created' : 'Create Tag'}
        </ActionButton>
        <ActionButton variant="outline" onClick={() => navigate('/categories-tags')}>
          Cancel
        </ActionButton>
      </div>

      <div className="h-4" />
    </AppShell>
  )
}
