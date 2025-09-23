// Web3 utility functions for KidsViewer

import { ethers } from 'ethers';
import { Account, RpcProvider } from 'starknet';
import { WalletConnection, TokenInfo, TransactionResult, SUPPORTED_NETWORKS } from '../../types/web3';

// Ethereum utilities
export class EthereumUtils {
    private static provider: ethers.BrowserProvider | null = null;
    private static signer: ethers.JsonRpcSigner | null = null;

    static async connectWallet(): Promise<WalletConnection> {
        try {
            if (!window.ethereum) {
                throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Get network info
            const network = await this.provider.getNetwork();

            return {
                address: accounts[0],
                chainId: Number(network.chainId),
                isConnected: true,
                provider: this.provider
            };
        } catch (error) {
            console.error('Failed to connect Ethereum wallet:', error);
            throw error;
        }
    }

    static async disconnectWallet(): Promise<void> {
        this.provider = null;
        this.signer = null;
    }

    static async switchToEthereumMainnet(): Promise<void> {
        if (!window.ethereum) {
            throw new Error('No Ethereum wallet found');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }], // Ethereum mainnet
            });
        } catch (error: any) {
            // If the chain doesn't exist, add it
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x1',
                        chainName: 'Ethereum Mainnet',
                        rpcUrls: [SUPPORTED_NETWORKS.ethereum.rpcUrl],
                        blockExplorerUrls: [SUPPORTED_NETWORKS.ethereum.blockExplorer],
                        nativeCurrency: {
                            name: 'Ether',
                            symbol: 'ETH',
                            decimals: 18,
                        },
                    }],
                });
            } else {
                throw error;
            }
        }
    }

    static async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }

        // ERC20 ABI for balanceOf function
        const erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)',
            'function name() view returns (string)'
        ];

        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
        const balance = await contract.balanceOf(walletAddress);
        const decimals = await contract.decimals();

        return ethers.formatUnits(balance, decimals);
    }

    static async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }

        const erc20Abi = [
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)',
            'function name() view returns (string)'
        ];

        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
        const [decimals, symbol, name] = await Promise.all([
            contract.decimals(),
            contract.symbol(),
            contract.name()
        ]);

        return {
            symbol,
            name,
            decimals: Number(decimals),
            address: tokenAddress,
            chainId: 1 // Ethereum mainnet
        };
    }

    static async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        try {
            const erc20Abi = [
                'function approve(address spender, uint256 amount) returns (bool)'
            ];

            const contract = new ethers.Contract(tokenAddress, erc20Abi, this.signer);
            const tx = await contract.approve(spenderAddress, amount);
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
}

// Starknet utilities
export class StarknetUtils {
    private static provider: RpcProvider | null = null;
    private static account: Account | null = null;

    static async connectWallet(): Promise<WalletConnection> {
        try {
            // Check if ArgentX or Braavos is available
            if (!window.starknet) {
                throw new Error('No Starknet wallet found. Please install ArgentX or Braavos wallet.');
            }

            // Connect to wallet
            await window.starknet.enable();

            if (!window.starknet.isConnected) {
                throw new Error('Failed to connect to Starknet wallet');
            }

            // Create provider
            this.provider = new RpcProvider({
                nodeUrl: SUPPORTED_NETWORKS.starknet.rpcUrl
            });

            // Create account
            this.account = new Account(
                this.provider,
                window.starknet.account.address,
                window.starknet.account.signer
            );

            return {
                address: window.starknet.account.address,
                chainId: Number(SUPPORTED_NETWORKS.starknet.chainId),
                isConnected: true,
                provider: this.provider
            };
        } catch (error) {
            console.error('Failed to connect Starknet wallet:', error);
            throw error;
        }
    }

    static async disconnectWallet(): Promise<void> {
        this.provider = null;
        this.account = null;
    }

    static async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }

        try {
            // ERC20 balanceOf function call
            const balanceCall = {
                contractAddress: tokenAddress,
                entrypoint: 'balanceOf',
                calldata: [walletAddress]
            };

            const result = await this.provider.callContract(balanceCall);
            // Convert from felt to string (assuming 6 decimals for USDC/USDT)
            const balance = BigInt(result[0]);
            return (Number(balance) / 1e6).toString();
        } catch (error) {
            console.error('Failed to get token balance:', error);
            return '0';
        }
    }

    static async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult> {
        if (!this.account) {
            throw new Error('Wallet not connected');
        }

        try {
            // Convert amount to felt (assuming 6 decimals)
            const amountFelt = (BigInt(parseFloat(amount) * 1e6)).toString();

            const approveCall = {
                contractAddress: tokenAddress,
                entrypoint: 'approve',
                calldata: [spenderAddress, amountFelt]
            };

            const tx = await this.account.execute(approveCall);
            await this.provider!.waitForTransaction(tx.transaction_hash);

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
}

// Common utilities
export class Web3Utils {
    static formatAddress(address: string): string {
        if (address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    static formatAmount(amount: string, _decimals: number = 6): string {
        const num = parseFloat(amount);
        if (num === 0) return '0';
        if (num < 0.000001) return '< 0.000001';
        return num.toFixed(6);
    }

    static async detectWallet(): Promise<'ethereum' | 'starknet' | null> {
        if (window.ethereum) return 'ethereum';
        if (window.starknet) return 'starknet';
        return null;
    }
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        ethereum?: any;
        starknet?: any;
    }
}
