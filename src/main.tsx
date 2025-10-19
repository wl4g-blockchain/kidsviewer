import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App.tsx'
import '@/index.css'
import { I18nProvider } from '@/components/i18n/I18nProvider.tsx'
import { wagmiConfig } from '@/config/appkit'
import { setupAPIInterceptor } from '@/utils/apiInterceptor'

// Setup global API interceptor for handling 401 errors
setupAPIInterceptor()

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
) 