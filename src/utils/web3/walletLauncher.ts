// Cross-platform wallet launcher utility for KidsViewer
// Supports web, Electron, and Capacitor (iOS/Android) platforms

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export interface WalletInfo {
    name: string;
    id: string;
    universalLink: string;
    deepLink: string;
    appStoreUrl: string;
    playStoreUrl: string;
    icon: string;
    supportedNetworks: ('ethereum' | 'starknet')[];
}

// Wallet configurations with Universal Links and Deep Links
export const WALLET_CONFIGS: Record<string, WalletInfo> = {
    metamask: {
        name: 'MetaMask',
        id: 'metamask',
        universalLink: 'https://metamask.app.link/dapp/',
        deepLink: 'metamask://dapp/',
        appStoreUrl: 'https://apps.apple.com/app/metamask/id1438144202',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
        icon: '🦊',
        supportedNetworks: ['ethereum']
    },
    argentx: {
        name: 'ArgentX',
        id: 'argentx',
        universalLink: 'https://argent.xyz/app/wallet/',
        deepLink: 'argent://app/wallet/',
        appStoreUrl: 'https://apps.apple.com/app/argent/id1358741926',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=xyz.argent.wallet',
        icon: '🛡️',
        supportedNetworks: ['starknet']
    },
    braavos: {
        name: 'Braavos',
        id: 'braavos',
        universalLink: 'https://app.braavos.com/',
        deepLink: 'braavos://app/',
        appStoreUrl: 'https://apps.apple.com/app/braavos-wallet/id1564391499',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.braavos.wallet',
        icon: '⚔️',
        supportedNetworks: ['starknet']
    },
    walletconnect: {
        name: 'WalletConnect',
        id: 'walletconnect',
        universalLink: 'https://walletconnect.com/app/',
        deepLink: 'walletconnect://app/',
        appStoreUrl: 'https://apps.apple.com/app/walletconnect/id1520334220',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.walletconnect.app',
        icon: '🔗',
        supportedNetworks: ['ethereum', 'starknet']
    }
};

export class WalletLauncher {
    private static isNativePlatform(): boolean {
        return Capacitor.isNativePlatform();
    }

    private static isElectron(): boolean {
        return typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron');
    }

    // private static isWeb(): boolean {
    //   return typeof window !== 'undefined' && !this.isNativePlatform() && !this.isElectron();
    // }

    // Check if wallet app is installed on the device
    static async isWalletInstalled(walletId: string): Promise<boolean> {
        const wallet = WALLET_CONFIGS[walletId];
        if (!wallet) return false;

        if (this.isNativePlatform()) {
            // On mobile platforms, try to detect if the app is installed
            try {
                // For iOS, we can try to open the deep link and catch the error
                if (Capacitor.getPlatform() === 'ios') {
                    await this.openDeepLink(wallet.deepLink);
                    return true;
                }
                // For Android, we can check if the app is installed
                else if (Capacitor.getPlatform() === 'android') {
                    // This would require a native plugin to check installed apps
                    // For now, we'll assume it's available if the deep link can be opened
                    return true;
                }
            } catch (error) {
                return false;
            }
        }

        // For web and Electron, check if the wallet is available in window object
        if (walletId === 'metamask') {
            return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
        }
        if (walletId === 'argentx' || walletId === 'braavos') {
            return typeof window !== 'undefined' && typeof window.starknet !== 'undefined';
        }

        return false;
    }

    // Launch wallet app with Universal Link or Deep Link
    static async launchWallet(walletId: string, redirectUrl?: string): Promise<boolean> {
        const wallet = WALLET_CONFIGS[walletId];
        if (!wallet) {
            throw new Error(`Wallet ${walletId} not supported`);
        }

        try {
            if (this.isNativePlatform()) {
                // On mobile platforms, use Universal Links or Deep Links
                const url = redirectUrl ? `${wallet.universalLink}${redirectUrl}` : wallet.universalLink;

                if (Capacitor.getPlatform() === 'ios') {
                    // Try deep link first, fallback to universal link
                    try {
                        await this.openDeepLink(wallet.deepLink);
                        return true;
                    } catch (error) {
                        // Fallback to universal link
                        await this.openUniversalLink(url);
                        return true;
                    }
                } else {
                    // Android - use deep link
                    await this.openDeepLink(wallet.deepLink);
                    return true;
                }
            } else if (this.isElectron()) {
                // On Electron, open in external browser
                const { shell } = require('electron');
                const url = redirectUrl ? `${wallet.universalLink}${redirectUrl}` : wallet.universalLink;
                await shell.openExternal(url);
                return true;
            } else {
                // On web, redirect to universal link
                const url = redirectUrl ? `${wallet.universalLink}${redirectUrl}` : wallet.universalLink;
                window.open(url, '_blank');
                return true;
            }
        } catch (error) {
            console.error(`Failed to launch wallet ${walletId}:`, error);
            return false;
        }
    }

    // Open deep link (for mobile apps)
    private static async openDeepLink(deepLink: string): Promise<void> {
        if (this.isNativePlatform()) {
            await Browser.open({ url: deepLink });
        } else {
            window.location.href = deepLink;
        }
    }

    // Open universal link (fallback for mobile)
    private static async openUniversalLink(universalLink: string): Promise<void> {
        if (this.isNativePlatform()) {
            await Browser.open({ url: universalLink });
        } else {
            window.open(universalLink, '_blank');
        }
    }

    // Get wallet app store URL for installation
    static getWalletInstallUrl(walletId: string): string {
        const wallet = WALLET_CONFIGS[walletId];
        if (!wallet) return '';

        if (this.isNativePlatform()) {
            if (Capacitor.getPlatform() === 'ios') {
                return wallet.appStoreUrl;
            } else if (Capacitor.getPlatform() === 'android') {
                return wallet.playStoreUrl;
            }
        }

        // For web and Electron, return universal link
        return wallet.universalLink;
    }

    // Get available wallets for current platform
    static getAvailableWallets(): WalletInfo[] {
        return Object.values(WALLET_CONFIGS);
    }

    // Get wallets for specific network
    static getWalletsForNetwork(network: 'ethereum' | 'starknet'): WalletInfo[] {
        return Object.values(WALLET_CONFIGS).filter(wallet =>
            wallet.supportedNetworks.includes(network)
        );
    }

    // Generate WalletConnect URI for web3 connection
    static generateWalletConnectUri(projectId: string, redirectUrl?: string): string {
        const baseUrl = 'https://walletconnect.com/app/';
        const params = new URLSearchParams({
            projectId,
            redirectUrl: redirectUrl || window.location.origin
        });
        return `${baseUrl}?${params.toString()}`;
    }

    // Handle wallet connection callback
    static async handleWalletCallback(callbackUrl: string): Promise<{
        success: boolean;
        walletId?: string;
        address?: string;
        signature?: string;
        error?: string;
    }> {
        try {
            const url = new URL(callbackUrl);
            const params = new URLSearchParams(url.search);

            const walletId = params.get('walletId');
            const address = params.get('address');
            const signature = params.get('signature');
            const error = params.get('error');

            if (error) {
                return { success: false, error };
            }

            if (walletId && address) {
                return { success: true, walletId, address, signature: signature || undefined };
            }

            return { success: false, error: 'Invalid callback parameters' };
        } catch (error) {
            return { success: false, error: 'Failed to parse callback URL' };
        }
    }
}

// Platform detection utilities
export const PlatformUtils = {
    isIOS: () => Capacitor.getPlatform() === 'ios',
    isAndroid: () => Capacitor.getPlatform() === 'android',
    isWeb: () => Capacitor.getPlatform() === 'web',
    isElectron: () => typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron'),
    isNative: () => Capacitor.isNativePlatform(),

    getPlatformName: () => {
        if (Capacitor.isNativePlatform()) {
            return Capacitor.getPlatform();
        }
        if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron')) {
            return 'electron';
        }
        return 'web';
    }
};
