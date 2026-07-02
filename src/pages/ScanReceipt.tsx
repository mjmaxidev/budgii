import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImageUp, Info, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { withFrom } from '@/utils/navigation'
import { MOCK_RECEIPT_MERCHANT, MOCK_RECEIPT_TOTAL } from '@/utils/mockAi'

export function ScanReceipt() {
  const navigate = useNavigate()
  const addReceipt = useStore((s) => s.addReceipt)
  const updateReceipt = useStore((s) => s.updateReceipt)
  const analyzeReceipt = useStore((s) => s.analyzeReceipt)
  const [analyzing, setAnalyzing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function handleFile(file?: File) {
    setAnalyzing(true)
    const merchant = file?.name?.split('.')[0] || MOCK_RECEIPT_MERCHANT
    const today = new Date().toISOString()
    let imageUrl = ''

    if (file) {
      imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }

    const id = addReceipt(merchant, today, MOCK_RECEIPT_TOTAL, imageUrl)

    window.setTimeout(() => {
      if (imageUrl) updateReceipt(id, { imageUrl, merchant: MOCK_RECEIPT_MERCHANT, total: MOCK_RECEIPT_TOTAL })
      analyzeReceipt(id)
      setAnalyzing(false)
      navigate(`/receipt-results/${id}`, withFrom('/scan-receipt'))
    }, 1200)
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Scan Receipt"
          showBack
          right={
            <button
              onClick={() => setShowInfo(true)}
              aria-label="How scanning works"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted active:bg-line/40"
            >
              <Info size={18} />
            </button>
          }
        />
      }
    >
      <p className="mb-5 text-center text-[16px] leading-snug text-muted">
        Capture or upload your receipt and let AI do the rest.
      </p>

      {/* Scan frame */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] rounded-card">
        <Corner className="left-0 top-0 border-l-4 border-t-4" />
        <Corner className="right-0 top-0 border-r-4 border-t-4" />
        <Corner className="bottom-0 left-0 border-b-4 border-l-4" />
        <Corner className="bottom-0 right-0 border-b-4 border-r-4" />
        <div className="absolute inset-4 flex flex-col items-center rounded-2xl bg-[#FAF6F0] p-5 font-mono text-[12px] text-ink/80 shadow-inner">
          <p className="text-[14px] font-bold tracking-wide">WHOLE FOODS MARKET</p>
          <p className="mt-1 text-[10px] text-muted">365 5th Ave, New York, NY</p>
          <div className="my-3 w-full border-t border-dashed border-line" />
          {[
            ['Milk 1%', '$3.49'],
            ['Organic Bananas', '$2.38'],
            ['Greek Yogurt', '$1.99'],
            ['Whole Grain Bread', '$3.79'],
            ['Coffee Beans', '$8.99'],
            ['Uber Trip', '$18.90'],
          ].map(([n, p]) => (
            <div key={n} className="flex w-full justify-between py-0.5">
              <span>{n}</span>
              <span>{p}</span>
            </div>
          ))}
          <div className="my-2 w-full border-t border-dashed border-line" />
          <div className="flex w-full justify-between font-bold">
            <span>Total</span>
            <span>$39.54</span>
          </div>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-input bg-green text-[16px] font-bold text-white shadow-soft active:scale-[0.98]"
        >
          <Camera size={20} /> Scan Receipt
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-input border-2 border-green bg-surface text-[16px] font-bold text-green active:bg-greenSoft"
        >
          <ImageUp size={20} /> Upload Photo
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {analyzing && (
        <div className="mt-5 rounded-card bg-greenSoft p-4">
          <div className="flex items-center gap-3">
            <Sparkles size={26} className="text-green" />
            <div>
              <p className="text-[16px] font-bold text-ink">Analyzing receipt...</p>
              <p className="text-[14px] text-muted">Extracting items with AI</p>
            </div>
          </div>
          <ProgressBar progress={0.65} color="#16A34A" className="mt-3" height={8} />
        </div>
      )}

      {!analyzing && (
        <button
          onClick={() => handleFile(undefined)}
          className="mt-4 w-full text-center text-[14px] font-semibold text-muted underline"
        >
          Use demo receipt (no photo)
        </button>
      )}

      <Modal open={showInfo} onClose={() => setShowInfo(false)} title="How scanning works" variant="center">
        <div className="space-y-3 text-[14px] leading-snug text-muted">
          <p>
            <span className="font-bold text-ink">1. Capture or upload</span> — take a photo of your
            receipt or choose one from your library.
          </p>
          <p>
            <span className="font-bold text-ink">2. AI reads the items</span> — each line item is
            extracted with a name, price, and suggested category.
          </p>
          <p>
            <span className="font-bold text-ink">3. Review & confirm</span> — fix anything the AI got
            wrong, then confirm to add everything to your expenses.
          </p>
        </div>
      </Modal>
    </AppShell>
  )
}

function Corner({ className }: { className: string }) {
  return <span className={`absolute h-8 w-8 rounded-[6px] border-green ${className}`} />
}
