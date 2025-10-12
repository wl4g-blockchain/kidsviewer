// Web3 Authentication Service for KidsViewer

import { getAppKit } from '../config/appkit'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { WalletConnection } from '../types/web3'

export interface Web3AuthState {
    isConnected: boolean
    address?: string
    chainId?: number
    walletId?: string
    authMethod?: 'email' | 'social' | 'wallet'
    socialProvider?: string
    email?: string
}

export class ReownConnectAuthService {
    private static instance: ReownConnectAuthService
    private authState: Web3AuthState = {
        isConnected: false,
    }

    static getInstance(): ReownConnectAuthService {
        if (!ReownConnectAuthService.instance) {
            ReownConnectAuthService.instance = new ReownConnectAuthService()
        }
        return ReownConnectAuthService.instance
    }

    // Open AppKit modal for authentication
    async openAuthModal(): Promise<Web3AuthState | null> {
        try {
            // Initialize AppKit on demand
            const appKit = await getAppKit()
            
            // Open AppKit modal
            await appKit.open()

            // For now, return a simple success state
            // In a real implementation, you would listen for connection events
            // or use React hooks to detect connection state
            console.log('AppKit modal opened successfully')
            
            // Return a mock success state for now
            // This should be replaced with actual connection detection
            return {
                isConnected: true,
                address: '0x0000000000000000000000000000000000000000', // Mock address
                chainId: 1, // Mock chain ID
                walletId: 'mock-wallet',
                authMethod: 'wallet',
            }
        } catch (error) {
            console.error('Failed to open auth modal:', error)
            throw error
        }
    }

    // Close AppKit modal
    async closeAuthModal(): Promise<void> {
        try {
            const appKit = await getAppKit()
            appKit.close()
        } catch (error) {
            console.error('Failed to close auth modal:', error)
        }
    }

    // Get current authentication state
    getAuthState(): Web3AuthState {
        return this.authState
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.authState.isConnected
    }

    // Get wallet connection info
    getWalletConnection(): WalletConnection | null {
        if (!this.authState.isConnected) {
            return null
        }

        return {
            address: this.authState.address!,
            chainId: this.authState.chainId!,
            isConnected: true,
            walletId: this.authState.walletId,
        }
    }

    // Sign out user
    async signOut(): Promise<void> {
        try {
            const appKit = await getAppKit()
            await appKit.disconnect()
            this.authState = {
                isConnected: false,
            }
        } catch (error) {
            console.error('Failed to sign out:', error)
            throw error
        }
    }

    // Check if user needs wallet binding (for social/email login)
    needsWalletBinding(): boolean {
        return this.authState.isConnected &&
            (this.authState.authMethod === 'email' || this.authState.authMethod === 'social')
    }

    // Bind additional wallet for social/email users
    async bindWallet(): Promise<WalletConnection | null> {
        if (!this.needsWalletBinding()) {
            throw new Error('User does not need wallet binding')
        }

        try {
            // Initialize AppKit on demand
            const appKit = await getAppKit()
            
            // Open wallet connection modal for additional wallet binding
            await appKit.open()

            // For now, return a mock wallet connection
            // This should be replaced with actual connection detection
            console.log('Wallet binding modal opened successfully')
            
            return {
                address: '0x0000000000000000000000000000000000000000', // Mock address
                chainId: 1, // Mock chain ID
                isConnected: true,
                walletId: 'mock-bound-wallet',
            }
        } catch (error) {
            console.error('Failed to bind wallet:', error)
            throw error
        }
    }
}

// Export singleton instance
export const reownConnectAuthService = ReownConnectAuthService.getInstance()

// React hooks for Web3 authentication
export const useWeb3Auth = () => {
    const { address, isConnected, chainId } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    const authState: Web3AuthState = {
        isConnected: isConnected && !!address,
        address,
        chainId,
        authMethod: 'wallet', // Default for wallet connection
    }

    return {
        authState,
        connect,
        disconnect,
        openAuthModal: reownConnectAuthService.openAuthModal.bind(reownConnectAuthService),
        closeAuthModal: reownConnectAuthService.closeAuthModal.bind(reownConnectAuthService),
        signOut: reownConnectAuthService.signOut.bind(reownConnectAuthService),
        needsWalletBinding: reownConnectAuthService.needsWalletBinding.bind(reownConnectAuthService),
        bindWallet: reownConnectAuthService.bindWallet.bind(reownConnectAuthService),
    }
}
