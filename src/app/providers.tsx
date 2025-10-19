'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { useState, useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient in client component
  const [queryClient] = useState(() => new QueryClient())
  const [wagmiConfig, setWagmiConfig] = useState<any>(null)

  // Load wagmi config only on client side
  useEffect(() => {
    const loadWagmiConfig = async () => {
      try {
        const { wagmiConfig: config } = await import('@/config/appkit')
        setWagmiConfig(config)
      } catch (error) {
        console.error('Failed to load wagmi config:', error)
      }
    }

    loadWagmiConfig()
  }, [])

  // Show loading state while wagmi config is loading
  if (!wagmiConfig) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
