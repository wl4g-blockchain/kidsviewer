'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '../../../src/i18n/I18nProvider'
import { AppProvider } from '../../../src/contexts/AppContext'
import { AuthProvider } from '../../../src/components/providers/AuthProvider'

interface ProvidersProps {
  children: any;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <I18nProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </I18nProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
