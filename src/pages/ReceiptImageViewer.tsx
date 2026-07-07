import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { useReceiptImageUrl } from '@/hooks/useReceiptImageUrl'
import { useStore } from '@/store/appStore'

export function ReceiptImageViewer() {
  const navigate = useNavigate()
  const { receiptId } = useParams<{ receiptId: string }>()
  const receipts = useStore((s) => s.receipts)
  const [zoom, setZoom] = useState(1)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const receipt = receipts.find((r) => r.id === receiptId)
  const receiptImageUrl = useReceiptImageUrl({
    receiptId: receipt?.id,
    uploadId: receipt?.uploadId,
    imageUrl: receipt?.imageUrl,
  })

  if (!receipt) {
    return (
      <AppShell showBottomNav topBar={<TopBar title="Receipt Image" showBack />}>
        <Card className="text-center py-8">
          <p className="text-[15px] font-semibold text-muted">Receipt not found</p>
          <ActionButton
            variant="primary"
            onClick={() => navigate('/receipt-history')}
            className="mt-4"
          >
            Back to Receipts
          </ActionButton>
        </Card>
      </AppShell>
    )
  }

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.2, 0.5))
  }

  const handleDownload = () => {
    if (receiptImageUrl) {
      const link = document.createElement('a')
      link.href = receiptImageUrl
      link.download = `receipt-${receipt.id}.png`
      link.click()
    }
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Receipt Image" showBack />}>
      {/* Receipt Info Card */}
      <Card className="mb-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold text-ink">{receipt.merchant}</p>
            <p className="text-[13px] text-muted mt-1">{receipt.date}</p>
            <p className="text-[17px] font-bold text-primary mt-2">${receipt.total.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Image Viewer */}
      {receiptImageUrl ? (
        <>
          {/* Main Image */}
          <div className="mb-4 overflow-hidden rounded-card bg-surfaceSoft">
            <div className="flex items-center justify-center bg-black/5 min-h-[400px] p-3">
              <img
                src={receiptImageUrl}
                alt={`Receipt from ${receipt.merchant}`}
                style={{
                  transform: `scale(${zoom})`,
                  maxHeight: '400px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.2s ease-out',
                }}
                onClick={() => setShowFullscreen(true)}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2 mb-4">
            <ActionButton
              variant="outline"
              leftIcon={<ZoomOut size={18} />}
              onClick={handleZoomOut}
              className="flex-1"
            >
              Zoom Out
            </ActionButton>
            <div className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-input border border-line bg-surface">
              <span className="text-[15px] font-semibold text-ink">{Math.round(zoom * 100)}%</span>
            </div>
            <ActionButton
              variant="outline"
              leftIcon={<ZoomIn size={18} />}
              onClick={handleZoomIn}
              className="flex-1"
            >
              Zoom In
            </ActionButton>
          </div>

          {/* Download Button */}
          <ActionButton
            variant="primary"
            leftIcon={<Download size={18} />}
            onClick={handleDownload}
          >
            Download Image
          </ActionButton>

          {/* Fullscreen Modal */}
          {showFullscreen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <img
                src={receiptImageUrl}
                alt={`Receipt from ${receipt.merchant} fullscreen`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-8">
          <p className="text-[15px] font-semibold text-muted">No image available</p>
          <p className="text-[13px] text-muted/70 mt-1">
            This receipt doesn't have an associated image
          </p>
        </Card>
      )}

      <div className="h-4" />
    </AppShell>
  )
}
