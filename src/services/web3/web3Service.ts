// Web3 Service Interface for KidsViewer
// Defines the contract for Web3 operations across different networks

import {
    WalletConnection,
    TransactionResult,
    VaultBalance,
    PiggyBankBalance,
    AaveProduct,
    WithdrawalRequest,
    InvestmentConfig,
    KRCHoldings,
    GovernanceProposal,
    RewardConfig,
    PiggyBankConfig
} from '../../types/web3';

export interface IWeb3Service {
    // Wallet management
    setWalletConnection(connection: WalletConnection): void;
    getWalletConnection(): WalletConnection | null;

    // Vault operations (Parent operations)
    depositToVault(tokenAddress: string, amount: string): Promise<TransactionResult>;
    withdrawFromVault(tokenAddress: string, amount: string): Promise<TransactionResult>;
    getVaultBalance(tokenAddress: string, userAddress: string): Promise<VaultBalance>;
    distributeReward(childAddress: string, tokenAddress: string, amount: string): Promise<TransactionResult>;
    setDailyRewardLimit(childAddress: string, tokenAddress: string, dailyLimit: string): Promise<TransactionResult>;
    authorizeChild(childAddress: string, authorized: boolean): Promise<TransactionResult>;
    getChildConfig(childAddress: string): Promise<{ dailyLimit: string; totalLimit: string; lastReset: number; isAuthorized: boolean }>;
    isParentAuthorized(parentAddress: string, childAddress: string): Promise<boolean>;

    // Piggy Bank operations (Child operations)
    receiveReward(childAddress: string, tokenAddress: string, amount: string): Promise<TransactionResult>;
    requestWithdrawal(tokenAddress: string, amount: string, reason: string): Promise<TransactionResult>;
    approveWithdrawal(requestId: number): Promise<TransactionResult>;
    rejectWithdrawal(requestId: number, reason: string): Promise<TransactionResult>;
    getPiggyBankBalance(tokenAddress: string, childAddress: string): Promise<PiggyBankBalance>;
    getChildEarnings(tokenAddress: string, childAddress: string): Promise<{ dailyEarnings: string; totalEarnings: string }>;
    getWithdrawalRequest(requestId: number): Promise<WithdrawalRequest>;
    getChildWithdrawalRequests(childAddress: string): Promise<WithdrawalRequest[]>;

    // Investment operations
    investInAave(tokenAddress: string, amount: string, aaveProduct: AaveProduct): Promise<TransactionResult>;
    recoverAllInvestments(childAddress: string, tokenAddress: string): Promise<TransactionResult>;
    setParentApproval(childAddress: string, approved: boolean): Promise<TransactionResult>;
    setInvestmentConfig(childAddress: string, enabled: boolean, maxAmount: string): Promise<TransactionResult>;
    setAaveProductApproval(childAddress: string, aaveProductAddress: string, approved: boolean): Promise<TransactionResult>;
    getInvestmentConfig(childAddress: string): Promise<InvestmentConfig>;
    isAaveProductApproved(childAddress: string, aaveProductAddress: string): Promise<boolean>;

    // KRC Token operations
    getKRCHoldings(userAddress: string): Promise<KRCHoldings>;
    startStaking(amount: string, duration: number): Promise<TransactionResult>;
    endStaking(): Promise<TransactionResult>;
    createProposal(title: string, description: string, duration: number): Promise<TransactionResult>;
    voteOnProposal(proposalId: number, support: boolean): Promise<TransactionResult>;
    executeProposal(proposalId: number): Promise<TransactionResult>;
    getProposal(proposalId: number): Promise<GovernanceProposal>;
    hasUserVoted(userAddress: string, proposalId: number): Promise<boolean>;

    // Utility operations
    getTokenBalance(tokenAddress: string, userAddress: string): Promise<string>;
    getTokenInfo(tokenAddress: string): Promise<{ symbol: string; name: string; decimals: number }>;
    getAvailableAaveProducts(): Promise<AaveProduct[]>;
    getTokenAddress(tokenType: string): Promise<string>;
    approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult>;

    // Reward processing
    processReward(rewardConfig: RewardConfig, childAddress: string): Promise<TransactionResult>;
    processAutoInvestment(piggyBankConfig: PiggyBankConfig, childAddress: string, availableAmount: number): Promise<TransactionResult>;
}

// Factory function to create appropriate Web3Service based on network
export function createWeb3Service(network: 'ethereum' | 'starknet'): IWeb3Service {
    if (network === 'ethereum') {
        const { EthereumWeb3Service } = require('./ethereumWeb3Service');
        return new EthereumWeb3Service();
    } else {
        const { StarknetWeb3Service } = require('./starknetWeb3Service');
        return new StarknetWeb3Service();
    }
}

// Singleton factory for current network
export class Web3ServiceFactory {
    private static instance: IWeb3Service | null = null;
    private static currentNetwork: 'ethereum' | 'starknet' = 'ethereum';

    static getInstance(network?: 'ethereum' | 'starknet'): IWeb3Service {
        if (network && network !== this.currentNetwork) {
            this.currentNetwork = network;
            this.instance = null; // Reset instance when network changes
        }

        if (!this.instance) {
            this.instance = createWeb3Service(this.currentNetwork);
        }

        return this.instance;
    }

    static setNetwork(network: 'ethereum' | 'starknet'): void {
        if (network !== this.currentNetwork) {
            this.currentNetwork = network;
            this.instance = null; // Reset instance when network changes
        }
    }

    static getCurrentNetwork(): 'ethereum' | 'starknet' {
        return this.currentNetwork;
    }
}

// Export singleton instance for backward compatibility
export const web3Service = Web3ServiceFactory.getInstance();
