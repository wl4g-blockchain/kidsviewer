// Lazy-loaded Reown AppKit Configuration for KidsViewer
// Only wallet connection, no social logins - initialized on demand

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
    mainnet, sepolia,
    arbitrum,
    polygon,
    optimism,
    avalanche, avalancheFuji,
    bsc, bscTestnet,
    base,
} from 'viem/chains'
import { createConfig, http } from 'wagmi'

// Get project ID from environment or use default
const projectId = import.meta.env.VITE_WALLETCONNECT_APP_ID || 'YOUR-PROJECT-ID'

// Create wagmi config
export const wagmiConfig = createConfig({
    chains: [mainnet, sepolia, arbitrum, polygon, optimism, avalanche, avalancheFuji, bsc, bscTestnet, base,],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [arbitrum.id]: http(),
        [polygon.id]: http(),
        [optimism.id]: http(),
        [avalanche.id]: http(),
        [avalancheFuji.id]: http(),
        [bsc.id]: http(),
        [bscTestnet.id]: http(),
        [base.id]: http(),
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
    // Force recreation to ensure new settings take effect
    if (appKitInstance) {
        console.log('Recreating AppKit instance with new settings...')
        appKitInstance = null
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
        console.log('Initializing Reown AppKit on demand with Project ID:', projectId, "...")

        // Validate project ID
        if (!projectId || projectId === 'YOUR-PROJECT-ID') {
            throw new Error('WalletConnect Project ID is not configured. Please set VITE_WALLETCONNECT_APP_ID in your environment variables.')
        }

        // Create wagmi adapter
        const wagmiAdapter = new WagmiAdapter({
            networks: [mainnet, sepolia, arbitrum, polygon, optimism, avalanche, avalancheFuji, bsc, bscTestnet, base,],
            projectId,
        })

        // Create AppKit instance - wallet only, no social logins
        appKitInstance = createAppKit({
            adapters: [wagmiAdapter],
            projectId,
            networks: [mainnet, sepolia, arbitrum, polygon, optimism, avalanche, avalancheFuji, bsc, bscTestnet, base,],
            metadata,
            features: {
                email: false, // Disable email login
                socials: [], // Disable all social logins
                emailShowWallets: false, // Don't show email options
            },
            allWallets: 'SHOW', // Show all wallets
            enableNetworkSwitch: false,
            enableReconnect: false,
            enableWalletGuide: true,
            enableWalletConnect: true,
            enableAuthLogger: true,
            experimental_preferUniversalLinks: true,
            debug: true,
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