// Web3 related types for KidsViewer

export interface WalletConnection {
    address: string;
    chainId: number;
    isConnected: boolean;
    provider?: any;
}

export interface TokenInfo {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
    chainId: number;
}

export interface RewardConfig {
    enabled: boolean;
    tokenType: 'USDC' | 'USDT' | 'KRC';
    rewardPerAnswer: number;
    dailyLimit: number;
    vaultAddress?: string;
}

export interface PiggyBankConfig {
    enabled: boolean;
    investmentPercentage: number;
    dailyMaxInvestment: number;
    cumulativeMaxInvestment: number;
    selectedAaveProduct?: AaveProduct;
}

export interface AaveProduct {
    id: string;
    name: string;
    symbol: string;
    apr: number;
    address: string;
    chainId: number;
}

export interface VaultBalance {
    token: TokenInfo;
    balance: string;
    formattedBalance: string;
}

export interface PiggyBankBalance {
    token: TokenInfo;
    balance: string;
    formattedBalance: string;
    dailyEarnings: string;
    totalEarnings: string;
}

export interface TransactionResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

// Supported networks
export const SUPPORTED_NETWORKS = {
    ethereum: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        blockExplorer: 'https://etherscan.io'
    },
    starknet: {
        chainId: '0x534e5f4d41494e', // SN_MAIN in hex
        name: 'Starknet Mainnet',
        rpcUrl: 'https://starknet-mainnet.infura.io/v3/demo',
        blockExplorer: 'https://starknet.io'
    }
} as const;

// Token addresses
export const TOKEN_ADDRESSES = {
    ethereum: {
        USDC: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        KRC: '0x1234567890123456789012345678901234567890' // Mock KRC address
    },
    starknet: {
        USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06b3ad0df8c',
        USDT: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
        KRC: '0x1234567890123456789012345678901234567890123456789012345678901234' // Mock KRC address
    }
} as const;

// Contract addresses
export const CONTRACT_ADDRESSES = {
    ethereum: {
        KidsViewerVault: '0x1234567890123456789012345678901234567890',
        KidsViewerPiggyBank: '0x0987654321098765432109876543210987654321'
    },
    starknet: {
        KidsViewerVault: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        KidsViewerPiggyBank: '0x0fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
    }
} as const;
