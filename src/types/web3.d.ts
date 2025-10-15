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
    settlementMode: 'realtime' | 'daily';
}

export interface PiggyBankConfig {
    enabled: boolean;
    investmentPercentage: number;
    dailyMaxInvestment: number;
    cumulativeMaxInvestment: number;
    selectedAaveProduct?: AaveProduct;
    defiEnabled: boolean;
    approvedAaveProducts: string[];
}

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
    feeDiscount: number;
    yieldBoost: number;
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
    investmentConfig: InvestmentConfig;
}

export interface TransactionResult {
    success: boolean;
    txHash?: string;
    error?: string;
}

export interface ZKProofData {
    proof: string;
    publicInputs: string[];
    circuitHash: string;
    timestamp: number;
}

export interface LearningData {
    totalQuestionsAnswered: number;
    correctAnswers: number;
    dailyStudyTimeMinutes: number;
    accumulatedRewards: string;
    parentApprovalHash: string;
}