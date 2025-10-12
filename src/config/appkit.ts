// Lazy-loaded Reown AppKit Configuration for KidsViewer
// Only wallet connection, no social logins - initialized on demand

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon } from 'viem/chains'
import { createConfig, http } from 'wagmi'

// Get project ID from environment or use default
const projectId = (import.meta as any).env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR-PROJECT-ID'

// Create wagmi config
export const wagmiConfig = createConfig({
    chains: [mainnet, arbitrum, polygon],
    transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
        [polygon.id]: http(),
    },
})

// App metadata
const metadata = {
    name: 'KidsViewer',
    description: 'A parental control app that promotes learning through educational challenges',
    url: 'https://kidsviewer.app',
    icons: ['/assets/icon-512x512.png']
}

// Lazy-loaded AppKit instance
let appKitInstance: ReturnType<typeof createAppKit> | null = null
let isInitializing = false

// Function to initialize AppKit on demand
export const initializeAppKit = async (): Promise<ReturnType<typeof createAppKit>> => {
    if (appKitInstance) {
        return appKitInstance
    }

    if (isInitializing) {
        // Wait for ongoing initialization
        return new Promise((resolve, reject) => {
            const checkInitialized = setInterval(() => {
                if (appKitInstance) {
                    clearInterval(checkInitialized)
                    resolve(appKitInstance)
                } else if (!isInitializing) {
                    clearInterval(checkInitialized)
                    reject(new Error('AppKit initialization failed'))
                }
            }, 100)
        })
    }

    isInitializing = true

    try {
        console.log('Initializing Reown AppKit on demand...')
        
        // Create wagmi adapter
        const wagmiAdapter = new WagmiAdapter({
            networks: [mainnet, arbitrum, polygon],
            projectId,
        })

        // Create AppKit instance - wallet only, no social logins
        appKitInstance = createAppKit({
            adapters: [wagmiAdapter],
            projectId,
            networks: [mainnet, arbitrum, polygon],
            metadata,
            features: {
                email: false, // Disable email login
                socials: [], // Disable all social logins
                emailShowWallets: false, // Don't show email options
            },
            allWallets: 'SHOW', // Show all wallets
        })

        console.log('Reown AppKit initialized successfully')
        return appKitInstance
    } catch (error) {
        console.error('Failed to initialize Reown AppKit:', error)
        throw error
    } finally {
        isInitializing = false
    }
}

// Function to get AppKit instance (initializes if needed)
export const getAppKit = async (): Promise<ReturnType<typeof createAppKit>> => {
    return await initializeAppKit()
}