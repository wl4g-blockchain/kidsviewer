// Sign-In with Ethereum (SIWE) service for KidsViewer
// Implements SIWE authentication flow for Web3 wallet connections

import { ethers } from 'ethers';
import { WalletLauncher, PlatformUtils } from '../utils/web3/walletLauncher';

export interface SIWEMessage {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime?: string;
    notBefore?: string;
    requestId?: string;
    resources?: string[];
}

export interface SIWEResult {
    success: boolean;
    address?: string;
    signature?: string;
    message?: string;
    error?: string;
}

export class SIWEService {
    private static readonly DOMAIN = 'kidsviewer.app';
    private static readonly STATEMENT = 'Sign in to KidsViewer to manage your child\'s learning rewards and investments.';
    private static readonly VERSION = '1';
    private static readonly CHAIN_ID = 1; // Ethereum mainnet

    // Generate SIWE message
    static generateMessage(address: string, nonce?: string): SIWEMessage {
        const now = new Date();
        const issuedAt = now.toISOString();

        return {
            domain: this.DOMAIN,
            address,
            statement: this.STATEMENT,
            uri: window.location.origin,
            version: this.VERSION,
            chainId: this.CHAIN_ID,
            nonce: nonce || this.generateNonce(),
            issuedAt,
            expirationTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };
    }

    // Generate random nonce
    private static generateNonce(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Format SIWE message for signing
    static formatMessage(message: SIWEMessage): string {
        const lines = [
            `${message.domain} wants you to sign in with your Ethereum account:`,
            message.address,
            '',
            message.statement,
            '',
            `URI: ${message.uri}`,
            `Version: ${message.version}`,
            `Chain ID: ${message.chainId}`,
            `Nonce: ${message.nonce}`,
            `Issued At: ${message.issuedAt}`,
        ];

        if (message.expirationTime) {
            lines.push(`Expiration Time: ${message.expirationTime}`);
        }

        if (message.notBefore) {
            lines.push(`Not Before: ${message.notBefore}`);
        }

        if (message.requestId) {
            lines.push(`Request ID: ${message.requestId}`);
        }

        if (message.resources && message.resources.length > 0) {
            lines.push(`Resources:`);
            message.resources.forEach(resource => {
                lines.push(`- ${resource}`);
            });
        }

        return lines.join('\n');
    }

    // Sign message with wallet
    static async signMessage(message: string, walletId: string): Promise<SIWEResult> {
        try {
            if (PlatformUtils.isNative()) {
                // On mobile platforms, launch wallet app and handle callback
                return await this.signMessageMobile(message, walletId);
            } else {
                // On web/Electron, use direct wallet connection
                return await this.signMessageWeb(message, walletId);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    // Sign message on web/Electron platforms
    private static async signMessageWeb(message: string, walletId: string): Promise<SIWEResult> {
        try {
            let signature: string;

            if (walletId === 'metamask' && window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                signature = await signer.signMessage(message);
            } else if ((walletId === 'argentx' || walletId === 'braavos') && window.starknet) {
                // For Starknet wallets, we need to implement Cairo message signing
                // This is a simplified version - in production, you'd use proper Starknet message signing
                throw new Error('Starknet message signing not implemented yet');
            } else {
                throw new Error(`Wallet ${walletId} not available`);
            }

            return {
                success: true,
                signature,
                message
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign message'
            };
        }
    }

    // Sign message on mobile platforms
    private static async signMessageMobile(message: string, walletId: string): Promise<SIWEResult> {
        try {
            // Generate callback URL for wallet app
            const callbackUrl = this.generateCallbackUrl(walletId);

            // Launch wallet app with message
            const success = await WalletLauncher.launchWallet(walletId, callbackUrl);

            if (!success) {
                return {
                    success: false,
                    error: 'Failed to launch wallet app'
                };
            }

            // In a real implementation, you would:
            // 1. Store the message and callback URL
            // 2. Wait for the wallet app to redirect back
            // 3. Parse the callback URL to get the signature
            // 4. Verify the signature

            // For now, return a mock success response
            return {
                success: true,
                signature: 'mock_signature_' + Date.now(),
                message
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sign message on mobile'
            };
        }
    }

    // Generate callback URL for wallet app
    private static generateCallbackUrl(walletId: string): string {
        const baseUrl = window.location.origin;
        const params = new URLSearchParams({
            walletId,
            action: 'sign',
            returnUrl: `${baseUrl}/wallet-callback`
        });
        return `${baseUrl}/wallet-callback?${params.toString()}`;
    }

    // Verify SIWE signature
    static async verifySignature(
        message: string,
        signature: string,
        address: string
    ): Promise<boolean> {
        try {
            // For Ethereum, verify using ecrecover
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Failed to verify signature:', error);
            return false;
        }
    }

    // Complete SIWE flow
    static async authenticate(walletId: string): Promise<SIWEResult> {
        try {
            // Generate a random address for the message (in real implementation, get from wallet)
            const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);

            // Generate SIWE message
            const siweMessage = this.generateMessage(mockAddress);
            const formattedMessage = this.formatMessage(siweMessage);

            // Sign the message
            const result = await this.signMessage(formattedMessage, walletId);

            if (result.success && result.signature) {
                // Verify the signature
                const isValid = await this.verifySignature(
                    formattedMessage,
                    result.signature,
                    mockAddress
                );

                if (isValid) {
                    return {
                        success: true,
                        address: mockAddress,
                        signature: result.signature,
                        message: formattedMessage
                    };
                } else {
                    return {
                        success: false,
                        error: 'Invalid signature'
                    };
                }
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }

    // Get wallet connection status
    static async getConnectionStatus(walletId: string): Promise<{
        isInstalled: boolean;
        isConnected: boolean;
        address?: string;
    }> {
        const isInstalled = await WalletLauncher.isWalletInstalled(walletId);

        if (!isInstalled) {
            return { isInstalled: false, isConnected: false };
        }

        // Check if wallet is connected
        let isConnected = false;
        let address: string | undefined;

        try {
            if (walletId === 'metamask' && window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                address = await signer.getAddress();
                isConnected = true;
            } else if ((walletId === 'argentx' || walletId === 'braavos') && window.starknet) {
                // For Starknet wallets
                address = window.starknet.account?.address;
                isConnected = !!address;
            }
        } catch (error) {
            console.error('Failed to get connection status:', error);
        }

        return { isInstalled, isConnected, address };
    }
}
