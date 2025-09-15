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
  TOKEN_ADDRESSES,
  CONTRACT_ADDRESSES,
  SUPPORTED_NETWORKS
} from '../types/web3';

// Smart Contract ABIs (simplified for demo)
const KIDSVIEWER_VAULT_ABI = [
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function getBalance(address token, address user) external view returns (uint256)',
  'function transferToPiggyBank(address token, uint256 amount, address child) external'
];

const KIDSVIEWER_PIGGYBANK_ABI = [
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function getBalance(address token, address user) external view returns (uint256)',
  'function investInAave(address token, uint256 amount, address aaveProduct) external',
  'function getDailyEarnings(address token, address user) external view returns (uint256)',
  'function getTotalEarnings(address token, address user) external view returns (uint256)'
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

  private getTokenAddress(tokenType: string): string {
    const network = this.walletConnection?.chainId === 1 ? 'ethereum' : 'starknet';
    return TOKEN_ADDRESSES[network][tokenType as keyof typeof TOKEN_ADDRESSES[typeof network]];
  }
}

// Export singleton instance
export const web3Service = Web3Service.getInstance();
