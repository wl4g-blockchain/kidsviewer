"use client"

import { Turnstile } from '@marsidev/react-turnstile'
import { useTranslation } from 'react-i18next'

interface TurnstileComponentProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  siteKey?: string
}

export function TurnstileComponent({ 
  onVerify, 
  onError, 
  onExpire, 
  siteKey 
}: TurnstileComponentProps) {
  const { t } = useTranslation()
  
  const turnstileSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!turnstileSiteKey) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <p className="text-yellow-800 text-sm">
          {t('register.configError')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        siteKey={turnstileSiteKey}
        onSuccess={onVerify}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'light',
          size: 'normal',
        }}
      />
    </div>
  )
}
