// Web3 Configuration Service
// Manages Web3 related configurations from the system config service

import { ConfigService } from './configService';

export interface Web3NetworkConfig {
    chainId: number | string;
    name: string;
    rpcUrl: string;
    blockExplorer: string;
}

export interface Web3TokenAddresses {
    [key: string]: string;
}

export interface Web3ContractAddresses {
    [key: string]: string;
}

export interface Web3AaveProduct {
    id: string;
    name: string;
    symbol: string;
    apr: number;
    address: string;
    chainId: number;
}

export class Web3ConfigService {
    private static instance: Web3ConfigService;
    private configService: ConfigService;

    private constructor() {
        this.configService = ConfigService.getInstance();
    }

    static getInstance(): Web3ConfigService {
        if (!Web3ConfigService.instance) {
            Web3ConfigService.instance = new Web3ConfigService();
        }
        return Web3ConfigService.instance;
    }

    // Get supported networks configuration
    async getSupportedNetworks(): Promise<{ ethereum: Web3NetworkConfig; starknet: Web3NetworkConfig }> {
        try {
            const ethereumConfig = this.configService.getConfig('WEB3_NETWORK_CONFIG_ETHEREUM');
            const starknetConfig = this.configService.getConfig('WEB3_NETWORK_CONFIG_STARKNET');

            return {
                ethereum: ethereumConfig?.value || {
                    chainId: 1,
                    name: 'Ethereum Sepolia',
                    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_API_KEY>',
                    blockExplorer: 'https://sepolia.etherscan.io'
                },
                starknet: starknetConfig?.value || {
                    chainId: '0x534e5f5345504f4c4941',
                    name: 'Starknet Devnet',
                    rpcUrl: 'http://localhost:5050/rpc',
                    blockExplorer: 'https://sepolia.starkscan.co'
                }
            };
        } catch (error) {
            console.error('Failed to load network configs:', error);
            // Return default configurations
            return {
                ethereum: {
                    chainId: 1,
                    name: 'Ethereum Sepolia',
                    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/<ALCHEMY_API_KEY>',
                    blockExplorer: 'https://sepolia.etherscan.io'
                },
                starknet: {
                    chainId: '0x534e5f5345504f4c4941',
                    name: 'Starknet Devnet',
                    rpcUrl: 'http://localhost:5050/rpc',
                    blockExplorer: 'https://sepolia.starkscan.co'
                }
            };
        }
    }

    // Get token addresses for a specific network
    async getTokenAddresses(network: 'ethereum' | 'starknet'): Promise<Web3TokenAddresses> {
        try {
            const config = this.configService.getConfig(`WEB3_TOKEN_ADDRS_${network.toUpperCase()}`);
            return config?.value || this.getDefaultTokenAddresses(network);
        } catch (error) {
            console.error(`Failed to load token addresses for ${network}:`, error);
            return this.getDefaultTokenAddresses(network);
        }
    }

    // Get contract addresses for a specific network
    async getContractAddresses(network: 'ethereum' | 'starknet'): Promise<Web3ContractAddresses> {
        try {
            const config = this.configService.getConfig(`WEB3_CONTRACT_ADDRS_${network.toUpperCase()}`);
            return config?.value || this.getDefaultContractAddresses(network);
        } catch (error) {
            console.error(`Failed to load contract addresses for ${network}:`, error);
            return this.getDefaultContractAddresses(network);
        }
    }

    // Get AAVE products for a specific network
    async getAaveProducts(network: 'ethereum' | 'starknet'): Promise<Web3AaveProduct[]> {
        try {
            const config = this.configService.getConfig(`WEB3_AAVE_PRODUCTS_${network.toUpperCase()}`);
            return config?.value || this.getDefaultAaveProducts(network);
        } catch (error) {
            console.error(`Failed to load AAVE products for ${network}:`, error);
            return this.getDefaultAaveProducts(network);
        }
    }

    // Get specific token address
    async getTokenAddress(network: 'ethereum' | 'starknet', tokenType: string): Promise<string> {
        const addresses = await this.getTokenAddresses(network);
        return addresses[tokenType] || '';
    }

    // Get specific contract address
    async getContractAddress(network: 'ethereum' | 'starknet', contractName: string): Promise<string> {
        const addresses = await this.getContractAddresses(network);
        return addresses[contractName] || '';
    }

    // Default configurations (fallback)
    private getDefaultTokenAddresses(network: 'ethereum' | 'starknet'): Web3TokenAddresses {
        if (network === 'ethereum') {
            return {
                USDC: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
                USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                KRC: '0x1234567890123456789012345678901234567890'
            };
        } else {
            return {
                USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06b3ad0df8c',
                USDT: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
                KRC: '0x1234567890123456789012345678901234567890123456789012345678901234'
            };
        }
    }

    private getDefaultContractAddresses(network: 'ethereum' | 'starknet'): Web3ContractAddresses {
        if (network === 'ethereum') {
            return {
                KidsViewerVault: '0x1234567890123456789012345678901234567890',
                KidsViewerPiggyBank: '0x0987654321098765432109876543210987654321',
                KRC: '0x1234567890123456789012345678901234567890'
            };
        } else {
            return {
                KidsViewerVault: '0x0000000000000000000000000000000000000000000000000000000000000000',
                KidsViewerPiggyBank: '0x03408bc6b059e7f8735e3206ad6b4450a3bfde02369ba00c2454fa22c41672ca',
                KRC: '0x0544e457da0bce9911e33b97367442a90ad8f046dbcf5dfb1e74323c12dc4ca3'
            };
        }
    }

    private getDefaultAaveProducts(network: 'ethereum' | 'starknet'): Web3AaveProduct[] {
        if (network === 'ethereum') {
            return [
                {
                    id: 'usdc-lending-ethereum',
                    name: 'USDC Lending Pool (Ethereum)',
                    symbol: 'aUSDC',
                    apr: 3.2,
                    address: '0x1234567890123456789012345678901234567890',
                    chainId: 1
                },
                {
                    id: 'usdt-lending-ethereum',
                    name: 'USDT Lending Pool (Ethereum)',
                    symbol: 'aUSDT',
                    apr: 2.8,
                    address: '0x0987654321098765432109876543210987654321',
                    chainId: 1
                }
            ];
        } else {
            return [
                {
                    id: 'usdc-lending-starknet',
                    name: 'USDC Lending Pool (Starknet)',
                    symbol: 'aUSDC',
                    apr: 3.5,
                    address: '0x1234567890123456789012345678901234567890123456789012345678901234',
                    chainId: 0x534e5f4d41494e
                }
            ];
        }
    }
}
