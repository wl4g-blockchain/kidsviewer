// Web3 Smart Contract Interaction Service for KidsViewer

import { ethers } from 'ethers';
import { Account, RpcProvider } from 'starknet';
import {
    WalletConnection,
    RewardConfig,
    PiggyBankConfig,
    TransactionResult,
    VaultBalance,
    PiggyBankBalance,
    AaveProduct,
    WithdrawalRequest,
    InvestmentConfig,
    KRCHoldings,
    GovernanceProposal,
    TOKEN_ADDRESSES,
    CONTRACT_ADDRESSES,
    SUPPORTED_NETWORKS,
    AAVE_PRODUCTS
} from '../types/web3';

// Smart Contract ABIs (simplified for demo)
const KIDSVIEWER_VAULT_ABI = [
    'function deposit(address token, uint256 amount) external',
    'function withdraw(address token, uint256 amount) external',
    'function getBalance(address token, address user) external view returns (uint256)',
    'function distributeReward(address child, address token, uint256 amount) external',
    'function setDailyRewardLimit(address child, address token, uint256 dailyLimit) external',
    'function authorizeChild(address child, bool authorized) external',
    'function getParentBalance(address parent, address token) external view returns (uint256)',
    'function getChildConfig(address child) external view returns (uint256, uint256, uint256, bool)',
    'function isParentAuthorized(address parent, address child) external view returns (bool)'
];

const KIDSVIEWER_PIGGYBANK_ABI = [
    'function receiveReward(address child, address token, uint256 amount) external',
    'function requestWithdrawal(address token, uint256 amount, string reason) external',
    'function approveWithdrawal(uint256 requestId) external',
    'function rejectWithdrawal(uint256 requestId, string reason) external',
    'function investInAave(address token, uint256 amount, address aaveProduct) external',
    'function recoverAllInvestments(address child, address token) external',
    'function setParentApproval(address child, bool approved) external',
    'function setInvestmentConfig(address child, bool enabled, uint256 maxAmount) external',
    'function setAaveProductApproval(address child, address aaveProduct, bool approved) external',
    'function getChildBalance(address child, address token) external view returns (uint256)',
    'function getChildEarnings(address child, address token) external view returns (uint256, uint256)',
    'function getWithdrawalRequest(uint256 requestId) external view returns (tuple(uint256,address,address,uint256,uint256,bool,bool,string))',
    'function getChildWithdrawalRequests(address child) external view returns (uint256[])',
    'function getInvestmentConfig(address child) external view returns (bool, uint256, uint256)',
    'function isAaveProductApproved(address child, address aaveProduct) external view returns (bool)'
];

const KRC_ABI = [
    'function mint(address to, uint256 amount) external',
    'function updateFeeDiscount(address user) external',
    'function updateYieldBoost(address user) external',
    'function grantPrivilegeAccess(address user, string feature) external',
    'function startStaking(uint256 amount, uint256 duration) external',
    'function endStaking() external',
    'function createProposal(string title, string description, uint256 duration) external',
    'function vote(uint256 proposalId, bool support) external',
    'function executeProposal(uint256 proposalId) external',
    'function getUserBenefits(address user) external view returns (tuple(uint256,uint256,uint256,bool,uint256,uint256,uint256,uint256))',
    'function getProposal(uint256 proposalId) external view returns (tuple(uint256,string,string,uint256,uint256,uint256,uint256,bool,address))',
    'function hasUserVoted(address user, uint256 proposalId) external view returns (bool)',
    'function getFeeDiscount(address user) external view returns (uint256)',
    'function getYieldBoost(address user) external view returns (uint256)',
    'function hasPrivilegeAccess(address user) external view returns (bool)'
];

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

export class Web3Service {
    private static instance: Web3Service;
    private walletConnection: WalletConnection | null = null;

    static getInstance(): Web3Service {
        if (!Web3Service.instance) {
            Web3Service.instance = new Web3Service();
        }
        return Web3Service.instance;
    }

    setWalletConnection(connection: WalletConnection): void {
        this.walletConnection = connection;
    }

    getWalletConnection(): WalletConnection | null {
        return this.walletConnection;
    }

    // Ethereum contract interactions
    async depositToVault(tokenAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const vaultAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerVault;
            const vaultContract = new ethers.Contract(vaultAddress, KIDSVIEWER_VAULT_ABI, signer);

            // Get token decimals
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            const tx = await vaultContract.deposit(tokenAddress, amountWei);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getVaultBalance(tokenAddress: string, userAddress: string): Promise<VaultBalance> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const vaultAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerVault;
            const vaultContract = new ethers.Contract(vaultAddress, KIDSVIEWER_VAULT_ABI, provider);

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const [balance, decimals, symbol, name] = await Promise.all([
                vaultContract.getBalance(tokenAddress, userAddress),
                tokenContract.decimals(),
                tokenContract.symbol(),
                tokenContract.name()
            ]);

            const formattedBalance = ethers.formatUnits(balance, decimals);

            return {
                token: {
                    symbol,
                    name,
                    decimals: Number(decimals),
                    address: tokenAddress,
                    chainId: 1
                },
                balance: balance.toString(),
                formattedBalance
            };
        } catch (error: any) {
            throw new Error(`Failed to get vault balance: ${error.message}`);
        }
    }

    async transferRewardToPiggyBank(tokenAddress: string, amount: string, childAddress: string): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const vaultAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerVault;
            const vaultContract = new ethers.Contract(vaultAddress, KIDSVIEWER_VAULT_ABI, signer);

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            const tx = await vaultContract.transferToPiggyBank(tokenAddress, amountWei, childAddress);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async investInAave(tokenAddress: string, amount: string, aaveProduct: AaveProduct): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, signer);

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            const tx = await piggyBankContract.investInAave(tokenAddress, amountWei, aaveProduct.address);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPiggyBankBalance(tokenAddress: string, userAddress: string): Promise<PiggyBankBalance> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, provider);

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const [balance, dailyEarnings, totalEarnings, decimals, symbol, name] = await Promise.all([
                piggyBankContract.getBalance(tokenAddress, userAddress),
                piggyBankContract.getDailyEarnings(tokenAddress, userAddress),
                piggyBankContract.getTotalEarnings(tokenAddress, userAddress),
                tokenContract.decimals(),
                tokenContract.symbol(),
                tokenContract.name()
            ]);

            const formattedBalance = ethers.formatUnits(balance, decimals);
            const formattedDailyEarnings = ethers.formatUnits(dailyEarnings, decimals);
            const formattedTotalEarnings = ethers.formatUnits(totalEarnings, decimals);

            return {
                token: {
                    symbol,
                    name,
                    decimals: Number(decimals),
                    address: tokenAddress,
                    chainId: 1
                },
                balance: balance.toString(),
                formattedBalance,
                dailyEarnings: formattedDailyEarnings,
                totalEarnings: formattedTotalEarnings
            };
        } catch (error: any) {
            throw new Error(`Failed to get piggy bank balance: ${error.message}`);
        }
    }

    // Starknet contract interactions (simplified)
    async depositToVaultStarknet(_tokenAddress: string, _amount: string): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== Number(SUPPORTED_NETWORKS.starknet.chainId)) {
            throw new Error('Starknet wallet not connected');
        }

        try {
            // Starknet implementation would go here
            // For now, return mock success
            return {
                success: true,
                txHash: '0x' + Math.random().toString(16).substr(2, 64)
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        if (this.walletConnection.chainId === 1) {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(userAddress),
                tokenContract.decimals()
            ]);
            return ethers.formatUnits(balance, decimals);
        } else {
            // Starknet implementation
            const provider = new RpcProvider({
                nodeUrl: SUPPORTED_NETWORKS.starknet.rpcUrl
            });

            const balanceCall = {
                contractAddress: tokenAddress,
                entrypoint: 'balanceOf',
                calldata: [userAddress]
            };

            const result = await provider.callContract(balanceCall);
            const balance = BigInt(result[0]);
            return (Number(balance) / 1e6).toString(); // Assuming 6 decimals for USDC/USDT
        }
    }

    async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        if (this.walletConnection.chainId === 1) {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

            const decimals = await tokenContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            const tx = await tokenContract.approve(spenderAddress, amountWei);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } else {
            // Starknet implementation
            const account = new Account(
                new RpcProvider({ nodeUrl: SUPPORTED_NETWORKS.starknet.rpcUrl }),
                this.walletConnection.address,
                window.starknet.account.signer
            );

            const amountFelt = (BigInt(parseFloat(amount) * 1e6)).toString();
            const approveCall = {
                contractAddress: tokenAddress,
                entrypoint: 'approve',
                calldata: [spenderAddress, amountFelt]
            };

            const tx = await account.execute(approveCall);
            await new RpcProvider({ nodeUrl: SUPPORTED_NETWORKS.starknet.rpcUrl }).waitForTransaction(tx.transaction_hash);

            return {
                success: true,
                txHash: tx.transaction_hash
            };
        }
    }

    // Reward processing
    async processReward(rewardConfig: RewardConfig, childAddress: string): Promise<TransactionResult> {
        if (!rewardConfig.enabled || !this.walletConnection) {
            return { success: false, error: 'Rewards not enabled or wallet not connected' };
        }

        try {
            const tokenAddress = this.getTokenAddress(rewardConfig.tokenType);
            const amount = rewardConfig.rewardPerAnswer.toString();

            // Transfer from vault to piggy bank
            return await this.transferRewardToPiggyBank(tokenAddress, amount, childAddress);
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Auto-investment processing
    async processAutoInvestment(piggyBankConfig: PiggyBankConfig, _childAddress: string, availableAmount: number): Promise<TransactionResult> {
        if (!piggyBankConfig.enabled || !piggyBankConfig.selectedAaveProduct || !this.walletConnection) {
            return { success: false, error: 'Auto-investment not configured' };
        }

        try {
            const investmentAmount = Math.min(
                availableAmount * (piggyBankConfig.investmentPercentage / 100),
                piggyBankConfig.dailyMaxInvestment
            );

            if (investmentAmount <= 0) {
                return { success: true, txHash: 'no-investment-needed' };
            }

            const tokenAddress = this.getTokenAddress('USDC'); // Default to USDC for investments
            return await this.investInAave(tokenAddress, investmentAmount.toString(), piggyBankConfig.selectedAaveProduct);
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // New methods for enhanced functionality

    // Withdrawal request management
    async requestWithdrawal(tokenAddress: string, amount: string, reason: string): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, signer);

            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();
            const amountWei = ethers.parseUnits(amount, decimals);

            const tx = await piggyBankContract.requestWithdrawal(tokenAddress, amountWei, reason);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async approveWithdrawal(requestId: number): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, signer);

            const tx = await piggyBankContract.approveWithdrawal(requestId);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getWithdrawalRequests(childAddress: string): Promise<WithdrawalRequest[]> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, provider);

            const requestIds = await piggyBankContract.getChildWithdrawalRequests(childAddress);
            const requests: WithdrawalRequest[] = [];

            for (const requestId of requestIds) {
                const request = await piggyBankContract.getWithdrawalRequest(requestId);
                requests.push({
                    id: Number(requestId),
                    child: request.child,
                    token: request.token,
                    amount: request.amount.toString(),
                    reason: request.reason,
                    timestamp: Number(request.timestamp),
                    isApproved: request.isApproved,
                    isProcessed: request.isProcessed
                });
            }

            return requests;
        } catch (error: any) {
            throw new Error(`Failed to get withdrawal requests: ${error.message}`);
        }
    }

    // Investment management
    async setInvestmentConfig(childAddress: string, enabled: boolean, maxAmount: string): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, signer);

            const tokenContract = new ethers.Contract(TOKEN_ADDRESSES.ethereum.USDC, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();
            const maxAmountWei = ethers.parseUnits(maxAmount, decimals);

            const tx = await piggyBankContract.setInvestmentConfig(childAddress, enabled, maxAmountWei);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async approveAaveProduct(childAddress: string, aaveProductAddress: string, approved: boolean): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, signer);

            const tx = await piggyBankContract.setAaveProductApproval(childAddress, aaveProductAddress, approved);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getInvestmentConfig(childAddress: string): Promise<InvestmentConfig> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const piggyBankAddress = CONTRACT_ADDRESSES.ethereum.KidsViewerPiggyBank;
            const piggyBankContract = new ethers.Contract(piggyBankAddress, KIDSVIEWER_PIGGYBANK_ABI, provider);

            const [isEnabled, maxInvestmentAmount, totalInvested] = await piggyBankContract.getInvestmentConfig(childAddress);

            const tokenContract = new ethers.Contract(TOKEN_ADDRESSES.ethereum.USDC, ERC20_ABI, provider);
            const decimals = await tokenContract.decimals();

            return {
                isEnabled,
                maxInvestmentAmount: ethers.formatUnits(maxInvestmentAmount, decimals),
                totalInvested: ethers.formatUnits(totalInvested, decimals),
                approvedAaveProducts: [] // This would need to be fetched separately
            };
        } catch (error: any) {
            throw new Error(`Failed to get investment config: ${error.message}`);
        }
    }

    // KRC token management
    async getKRCHoldings(userAddress: string): Promise<KRCHoldings> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, provider);

            const [balance, feeDiscount, yieldBoost, governancePower, hasPrivilegeAccess] = await Promise.all([
                krcContract.balanceOf(userAddress),
                krcContract.getFeeDiscount(userAddress),
                krcContract.getYieldBoost(userAddress),
                krcContract.getUserBenefits(userAddress).then((benefits: any) => benefits.governancePower),
                krcContract.hasPrivilegeAccess(userAddress)
            ]);

            const decimals = 18; // KRC has 18 decimals

            return {
                balance: ethers.formatUnits(balance, decimals),
                feeDiscount: Number(feeDiscount),
                yieldBoost: Number(yieldBoost),
                governancePower: ethers.formatUnits(governancePower, decimals),
                hasPrivilegeAccess,
                stakingAmount: '0', // Would need to fetch from getUserBenefits
                stakingRewards: '0' // Would need to fetch from getUserBenefits
            };
        } catch (error: any) {
            throw new Error(`Failed to get KRC holdings: ${error.message}`);
        }
    }

    async startStaking(amount: string, duration: number): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, signer);

            const amountWei = ethers.parseUnits(amount, 18);
            const durationSeconds = duration * 24 * 60 * 60; // Convert days to seconds

            const tx = await krcContract.startStaking(amountWei, durationSeconds);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async endStaking(): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, signer);

            const tx = await krcContract.endStaking();
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Governance functions
    async createProposal(title: string, description: string, duration: number): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, signer);

            const durationSeconds = duration * 24 * 60 * 60; // Convert days to seconds

            const tx = await krcContract.createProposal(title, description, durationSeconds);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async voteOnProposal(proposalId: number, support: boolean): Promise<TransactionResult> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, signer);

            const tx = await krcContract.vote(proposalId, support);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getProposal(proposalId: number): Promise<GovernanceProposal> {
        if (!this.walletConnection || this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const krcAddress = CONTRACT_ADDRESSES.ethereum.KRC;
            const krcContract = new ethers.Contract(krcAddress, KRC_ABI, provider);

            const proposal = await krcContract.getProposal(proposalId);

            return {
                id: Number(proposal.id),
                title: proposal.title,
                description: proposal.description,
                startTime: Number(proposal.startTime),
                endTime: Number(proposal.endTime),
                forVotes: proposal.forVotes.toString(),
                againstVotes: proposal.againstVotes.toString(),
                executed: proposal.executed,
                proposer: proposal.proposer
            };
        } catch (error: any) {
            throw new Error(`Failed to get proposal: ${error.message}`);
        }
    }

    // Get available AAVE products
    getAvailableAaveProducts(): AaveProduct[] {
        const network = this.walletConnection?.chainId === 1 ? 'ethereum' : 'starknet';
        return [...(AAVE_PRODUCTS[network] || [])];
    }

    private getTokenAddress(tokenType: string): string {
        const network = this.walletConnection?.chainId === 1 ? 'ethereum' : 'starknet';
        return TOKEN_ADDRESSES[network][tokenType as keyof typeof TOKEN_ADDRESSES[typeof network]];
    }
}

// Export singleton instance
export const web3Service = Web3Service.getInstance();
