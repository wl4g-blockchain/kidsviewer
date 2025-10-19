// Web3 Smart Contract Interaction Service for KidsViewer

import { ethers } from 'ethers';
import { Account, RpcProvider } from 'starknet';
import {
    WalletConnection,
    TransactionResult,
    VaultBalance,
    AaveProduct
} from '@/types/web3';
import { Web3ConfigService } from './web3ConfigService';

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

// Note: PiggyBank and KRC ABIs removed as they are not currently used in the simplified service

const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

// Note: Starknet ABIs removed as they are not currently used in the simplified service

export class Web3Service {
    private static instance: Web3Service;
    private walletConnection: WalletConnection | null = null;
    private web3ConfigService: Web3ConfigService;

    static getInstance(): Web3Service {
        if (!Web3Service.instance) {
            Web3Service.instance = new Web3Service();
        }
        return Web3Service.instance;
    }

    private constructor() {
        this.web3ConfigService = Web3ConfigService.getInstance();
    }

    setWalletConnection(connection: WalletConnection): void {
        this.walletConnection = connection;
    }

    getWalletConnection(): WalletConnection | null {
        return this.walletConnection;
    }

    // Contract interactions (Ethereum and Starknet)
    async depositToVault(tokenAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        // Check if it's Starknet
        const networks = await this.web3ConfigService.getSupportedNetworks();
        if (this.walletConnection.chainId === Number(networks.starknet.chainId)) {
            return this.depositToVaultStarknet(tokenAddress, amount);
        }

        // Ethereum implementation
        if (this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const vaultAddress = await this.web3ConfigService.getContractAddress('ethereum', 'KidsViewerVault');
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
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        // Check if it's Starknet
        const networks = await this.web3ConfigService.getSupportedNetworks();
        if (this.walletConnection.chainId === Number(networks.starknet.chainId)) {
            return this.getVaultBalanceStarknet(tokenAddress, userAddress);
        }

        // Ethereum implementation
        if (this.walletConnection.chainId !== 1) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found');
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const vaultAddress = await this.web3ConfigService.getContractAddress('ethereum', 'KidsViewerVault');
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

    async getVaultBalanceStarknet(tokenAddress: string, userAddress: string): Promise<VaultBalance> {
        try {
            const networks = await this.web3ConfigService.getSupportedNetworks();
            const provider = new RpcProvider({
                nodeUrl: networks.starknet.rpcUrl
            });

            // Get vault balance
            const vaultAddress = await this.web3ConfigService.getContractAddress('starknet', 'KidsViewerVault');
            const balanceCall = {
                contractAddress: vaultAddress,
                entrypoint: 'get_parent_balance',
                calldata: [userAddress, tokenAddress]
            };

            const balanceResult = await provider.callContract(balanceCall);
            const balance = balanceResult[0];

            const formattedBalance = (Number(balance) / 1e6).toString(); // Assuming 6 decimals

            return {
                token: {
                    symbol: 'USDC', // Mock for now
                    name: 'USD Coin',
                    decimals: 6,
                    address: tokenAddress,
                    chainId: this.walletConnection!.chainId
                },
                balance: balance,
                formattedBalance
            };
        } catch (error: any) {
            throw new Error(`Failed to get vault balance: ${error.message}`);
        }
    }

    // Starknet contract interactions
    async depositToVaultStarknet(tokenAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.walletConnection) {
            throw new Error('Starknet wallet not connected');
        }

        try {
            if (!window.starknet) {
                throw new Error('No Starknet wallet found');
            }

            const networks = await this.web3ConfigService.getSupportedNetworks();
            const provider = new RpcProvider({
                nodeUrl: networks.starknet.rpcUrl
            });

            const account = new Account(
                provider,
                this.walletConnection.address,
                window.starknet.account.signer
            );

            // Convert amount to wei (assuming 6 decimals for USDC/USDT)
            const amountWei = (BigInt(parseFloat(amount) * 1e6)).toString();

            // First approve the vault to spend tokens
            const vaultAddress = await this.web3ConfigService.getContractAddress('starknet', 'KidsViewerVault');
            const approveCall = {
                contractAddress: tokenAddress,
                entrypoint: 'approve',
                calldata: [vaultAddress, amountWei, '0']
            };

            // Then deposit to vault
            const depositCall = {
                contractAddress: vaultAddress,
                entrypoint: 'deposit',
                calldata: [tokenAddress, amountWei]
            };

            const tx = await account.execute([approveCall, depositCall]);
            await provider.waitForTransaction(tx.transaction_hash);

            return {
                success: true,
                txHash: tx.transaction_hash
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

        try {
            if (this.walletConnection.chainId === 1) {
                // Ethereum
                if (!window.ethereum) {
                    throw new Error('No Ethereum wallet found');
                }
                const provider = new ethers.BrowserProvider(window.ethereum);
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                const balance = await tokenContract.balanceOf(userAddress);
                const decimals = await tokenContract.decimals();
                return ethers.formatUnits(balance, decimals);
            } else {
                // Starknet
                const networks = await this.web3ConfigService.getSupportedNetworks();
                const provider = new RpcProvider({
                    nodeUrl: networks.starknet.rpcUrl
                });

                const balanceCall = {
                    contractAddress: tokenAddress,
                    entrypoint: 'balanceOf',
                    calldata: [userAddress]
                };

                const balanceResult = await provider.callContract(balanceCall);
                const balance = balanceResult[0];
                return (Number(balance) / 1e6).toString(); // Assuming 6 decimals
            }
        } catch (error: any) {
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    async getTokenInfo(tokenAddress: string): Promise<{ symbol: string; name: string; decimals: number }> {
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        try {
            if (this.walletConnection.chainId === 1) {
                // Ethereum
                if (!window.ethereum) {
                    throw new Error('No Ethereum wallet found');
                }
                const provider = new ethers.BrowserProvider(window.ethereum);
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                const [symbol, name, decimals] = await Promise.all([
                    tokenContract.symbol(),
                    tokenContract.name(),
                    tokenContract.decimals()
                ]);

                return { symbol, name, decimals: Number(decimals) };
            } else {
                // Starknet - return mock data for now
                return {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    decimals: 6
                };
            }
        } catch (error: any) {
            throw new Error(`Failed to get token info: ${error.message}`);
        }
    }

    // Get available AAVE products
    async getAvailableAaveProducts(): Promise<AaveProduct[]> {
        if (!this.walletConnection) {
            return [];
        }

        const network = this.walletConnection.chainId === 1 ? 'ethereum' : 'starknet';
        return await this.web3ConfigService.getAaveProducts(network);
    }

    // Get token address for current network
    async getTokenAddress(tokenType: string): Promise<string> {
        if (!this.walletConnection) {
            throw new Error('Wallet not connected');
        }

        const network = this.walletConnection.chainId === 1 ? 'ethereum' : 'starknet';
        return await this.web3ConfigService.getTokenAddress(network, tokenType);
    }
}

// Export singleton instance
export const web3Service = Web3Service.getInstance();
