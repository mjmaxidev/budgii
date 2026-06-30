import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { useStore } from '@/store/appStore'

const TAG_COLORS = [
  { name: 'Orange', hex: '#FB8500' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Blue', hex: '#2386F6' },
  { name: 'Purple', hex: '#9B5DE5' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Indigo', hex: '#4F46E5' },
]

export function TagCreation() {
  const navigate = useNavigate()
  const addTag = useStore((s) => s.addTag)

  // Form state
  const [tagName, setTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].hex)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const selectedColorObj = TAG_COLORS.find((c) => c.hex === selectedColor)

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

  const handleCancel = () => {
    navigate('/categories-tags')
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Create Tag" showBack />}>
      {/* Header Info */}
      <div className="mb-6 text-center">
        <p className="text-[15px] font-semibold text-ink">Create a new tag</p>
        <p className="text-[13px] text-muted mt-1">Tags help you organize and filter your transactions</p>
      </div>

      {/* Form Card */}
      <Card className="space-y-5 mb-6">
        {/* Tag Name Input */}
        <div>
          <FormField
            label="Tag Name"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="e.g., Shopping, Work, Groceries"
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="mb-2 block text-[13px] font-bold uppercase tracking-wide text-muted">
            Color
          </label>

          {/* Color Preview Button */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full rounded-input border border-line bg-surface px-4 py-3 flex items-center justify-between active:bg-surfaceSoft transition"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-lg shadow-soft"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-[15px] font-semibold text-ink">
                {selectedColorObj?.name}
              </span>
            </div>
            <ChevronDown
              size={20}
              className={`text-muted transition-transform ${showColorPicker ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Color Grid */}
          {showColorPicker && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => {
                    setSelectedColor(color.hex)
                    setShowColorPicker(false)
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition ${
                    selectedColor === color.hex
                      ? 'bg-primarySoft ring-2 ring-primary'
                      : 'bg-surface active:bg-surfaceSoft'
                  }`}
                  title={color.name}
                >
                  <div
                    className="h-8 w-8 rounded-lg shadow-soft"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[11px] font-semibold text-muted text-center">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {tagName && (
          <div>
            <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">
              Preview
            </p>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {tagName}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        <ActionButton
          variant="primary"
          onClick={handleSave}
          className={isSaved ? 'bg-green' : ''}
        >
          {isSaved ? '✓ Tag Created' : 'Create Tag'}
        </ActionButton>
        <ActionButton variant="outline" onClick={handleCancel}>
          Cancel
        </ActionButton>
      </div>

      <div className="h-4" />
    </AppShell>
  )
}
