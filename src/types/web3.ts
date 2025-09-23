// Web3 related types for KidsViewer

export interface WalletConnection {
    address: string;
    chainId: number;
    isConnected: boolean;
    provider?: any;
    walletId?: string;
    signature?: string;
    timestamp?: number;
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
    settlementMode: 'realtime' | 'daily'; // New: reward settlement mode
}

export interface PiggyBankConfig {
    enabled: boolean;
    investmentPercentage: number;
    dailyMaxInvestment: number;
    cumulativeMaxInvestment: number;
    selectedAaveProduct?: AaveProduct;
    defiEnabled: boolean; // New: whether DeFi investment is enabled
    approvedAaveProducts: string[]; // New: approved AAVE products
}

// New interfaces for enhanced functionality
export interface WithdrawalRequest {
    id: number;
    child: string;
    token: string;
    amount: string;
    reason: string;
    timestamp: number;
    isApproved: boolean;
    isProcessed: boolean;
}

export interface InvestmentConfig {
    isEnabled: boolean;
    maxInvestmentAmount: string;
    totalInvested: string;
    approvedAaveProducts: string[];
}

export interface KRCHoldings {
    balance: string;
    feeDiscount: number; // in basis points
    yieldBoost: number; // in basis points
    governancePower: string;
    hasPrivilegeAccess: boolean;
    stakingAmount: string;
    stakingRewards: string;
}

export interface GovernanceProposal {
    id: number;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    forVotes: string;
    againstVotes: string;
    executed: boolean;
    proposer: string;
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
        KidsViewerPiggyBank: '0x0987654321098765432109876543210987654321',
        KRC: '0x1234567890123456789012345678901234567890'
    },
    starknet: {
        KidsViewerVault: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        KidsViewerPiggyBank: '0x0fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        KRC: '0x1234567890123456789012345678901234567890123456789012345678901234'
    }
} as const;

// AAVE Products for DeFi investment
export const AAVE_PRODUCTS = {
    ethereum: [
        {
            id: 'usdc-lending',
            name: 'USDC Lending Pool',
            symbol: 'aUSDC',
            apr: 3.5,
            address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
            chainId: 1
        },
        {
            id: 'usdt-lending',
            name: 'USDT Lending Pool',
            symbol: 'aUSDT',
            apr: 3.2,
            address: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
            chainId: 1
        }
    ],
    starknet: [
        {
            id: 'usdc-lending-starknet',
            name: 'USDC Lending Pool (Starknet)',
            symbol: 'aUSDC',
            apr: 3.5,
            address: '0x1234567890123456789012345678901234567890123456789012345678901234',
            chainId: 0x534e5f4d41494e
        }
    ]
} as const;
