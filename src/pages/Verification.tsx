import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Mail, Check, CheckCircle2, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { cn } from '@/utils/cn'
import { isApiEnabled } from '@/api/config'

type VerificationType = 'phone' | 'email' | null

export function Verification() {
  const navigate = useNavigate()
  const apiOn = isApiEnabled()
  const [verificationType, setVerificationType] = useState<VerificationType>(null)
  const [contactInput, setContactInput] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = () => {
    if (!contactInput.trim() || !verificationCode.trim()) return
    setIsVerified(true)
  }

  const handleContinue = () => {
    if (isVerified) {
      navigate('/home')
    }
  }

  return (
    <AppShell contentClassName="flex flex-col justify-between pb-20">
      <div className="mt-6 mb-8">
        <h1 className="text-[28px] font-extrabold text-ink">Verify Your Account</h1>
        <p className="mt-2 text-[15px] text-muted">Choose how you'd like to receive your verification code.</p>
      </div>

      {!verificationType && (
        <div className="space-y-3">
          <button
            onClick={() => setVerificationType('phone')}
            disabled={apiOn}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-line bg-surface p-4 transition-all hover:border-primary hover:bg-primarySoft disabled:hidden"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-ink">Text Message</p>
              <p className="text-[13px] text-muted">Receive code via SMS</p>
            </div>
            <ChevronRight size={20} className="text-muted" />
          </button>

          <button
            onClick={() => setVerificationType('email')}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-line bg-surface p-4 transition-all hover:border-primary hover:bg-primarySoft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail size={24} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-ink">Email</p>
              <p className="text-[13px] text-muted">Receive code via email</p>
            </div>
            <ChevronRight size={20} className="text-muted" />
          </button>
        </div>
      )}

      {verificationType && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  verificationType === 'phone' ? 'bg-blue-100' : 'bg-orange-100'
                )}
              >
                {verificationType === 'phone' ? (
                  <MessageSquare size={20} className="text-blue-600" />
                ) : (
                  <Mail size={20} className="text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-ink">{verificationType === 'phone' ? 'Phone Number' : 'Email Address'}</p>
                <p className="text-[12px] text-muted">{verificationType === 'phone' ? 'Enter your phone number' : 'Enter your email address'}</p>
              </div>
              <button onClick={() => setVerificationType(null)} className="text-[13px] font-bold text-primary">
                Change
              </button>
            </div>
            <input
              type={verificationType === 'phone' ? 'tel' : 'email'}
              placeholder={verificationType === 'phone' ? '+1 (555) 123-4567' : 'you@example.com'}
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              disabled={isVerified}
              className="w-full rounded-input border border-line bg-surfaceSoft px-3 py-2.5 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-muted/50 outline-none disabled:opacity-50"
            />
          </Card>

          {contactInput.trim() && !isVerified && (
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <Check size={20} className="text-green-600" />
                </div>
                <p className="text-[15px] font-bold text-ink">Verification Code</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className="flex-1 rounded-input border border-line bg-surfaceSoft px-3 py-2.5 text-center text-[20px] font-bold text-ink placeholder:text-muted/50 outline-none"
                />
              </div>
              <p className="mt-2 text-[12px] text-muted">Check your {verificationType === 'phone' ? 'SMS' : 'email'}</p>
            </Card>
          )}

          {isVerified && (
            <Card className="flex items-center gap-3 bg-green-50 border-green-200">
              <CheckCircle2 size={24} className="text-green-600" />
              <div>
                <p className="font-bold text-green-900">Account verified</p>
                <p className="text-[13px] text-green-700">You're all set to get started</p>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-surface px-4 py-3">
        <div className="flex gap-2">
          <ActionButton variant="outline" className="flex-1" onClick={() => navigate('/home')}>
            Skip
          </ActionButton>
          <ActionButton
            variant="primary"
            className="flex-1"
            disabled={!isVerified && (verificationType ? !contactInput.trim() : true)}
            onClick={isVerified ? handleContinue : handleVerify}
          >
            {isVerified ? 'Continue' : 'Verify'}
          </ActionButton>
        </div>
      </div>
    </AppShell>
  )
}
