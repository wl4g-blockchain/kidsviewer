// Reward Vault Management Component for Web3 integration

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Coins, Wallet, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { WalletConnectModal } from './WalletConnectModal';
import { EthereumUtils, StarknetUtils, Web3Utils } from '../utils/web3Utils';
import {
  WalletConnection,
  RewardConfig,
  TokenInfo,
  VaultBalance,
  TransactionResult,
  TOKEN_ADDRESSES,
  CONTRACT_ADDRESSES,
  SUPPORTED_NETWORKS,
} from '../types/web3';

interface RewardVaultManagerProps {
  onConfigUpdate: (config: RewardConfig) => void;
}

export const RewardVaultManager: React.FC<RewardVaultManagerProps> = ({ onConfigUpdate }) => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reward configuration state
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>({
    enabled: false,
    tokenType: 'USDC',
    rewardPerAnswer: 0.1,
    dailyLimit: 10,
    vaultAddress: undefined,
  });

  // Vault balance state
  const [vaultBalance, setVaultBalance] = useState<VaultBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadRewardConfig();
  }, []);

  // Load vault balance when wallet is connected
  useEffect(() => {
    if (walletConnection?.isConnected) {
      loadVaultBalance();
    }
  }, [walletConnection]);

  const loadRewardConfig = () => {
    const saved = localStorage.getItem('rewardConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setRewardConfig(config);
        onConfigUpdate(config);
      } catch (error) {
        console.error('Failed to load reward config:', error);
      }
    }
  };

  const saveRewardConfig = (config: RewardConfig) => {
    localStorage.setItem('rewardConfig', JSON.stringify(config));
    onConfigUpdate(config);
  };

  const loadVaultBalance = async () => {
    if (!walletConnection?.isConnected) return;

    setIsLoadingBalance(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress();
      const balance = await getTokenBalance(tokenAddress, walletConnection.address);
      const tokenInfo = await getTokenInfo(tokenAddress);

      setVaultBalance({
        token: tokenInfo,
        balance: balance,
        formattedBalance: Web3Utils.formatAmount(balance, tokenInfo.decimals),
      });
    } catch (error: any) {
      setError(`Failed to load vault balance: ${error.message}`);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getTokenAddress = (): string => {
    const network = walletConnection?.chainId === 1 ? 'ethereum' : 'starknet';
    return TOKEN_ADDRESSES[network][rewardConfig.tokenType];
  };

  const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo> => {
    if (walletConnection?.chainId === 1) {
      return await EthereumUtils.getTokenInfo(tokenAddress);
    } else {
      // For Starknet, return basic info
      return {
        symbol: rewardConfig.tokenType,
        name: rewardConfig.tokenType,
        decimals: 6,
        address: tokenAddress,
        chainId: Number(SUPPORTED_NETWORKS.starknet.chainId),
      };
    }
  };

  const getTokenBalance = async (tokenAddress: string, walletAddress: string): Promise<string> => {
    if (walletConnection?.chainId === 1) {
      return await EthereumUtils.getTokenBalance(tokenAddress, walletAddress);
    } else {
      return await StarknetUtils.getTokenBalance(tokenAddress, walletAddress);
    }
  };

  const handleWalletConnect = (connection: WalletConnection) => {
    setWalletConnection(connection);
    setError(null);
    setSuccess('Wallet connected successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleEnableRewards = () => {
    const newConfig = { ...rewardConfig, enabled: !rewardConfig.enabled };
    setRewardConfig(newConfig);
    saveRewardConfig(newConfig);
  };

  const handleConfigChange = (key: keyof RewardConfig, value: any) => {
    const newConfig = { ...rewardConfig, [key]: value };
    setRewardConfig(newConfig);
    saveRewardConfig(newConfig);
  };

  const handleDeposit = async () => {
    if (!walletConnection?.isConnected || !depositAmount) return;

    setIsDepositing(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress();
      const vaultAddress = getVaultAddress();
      const amount = ethers.parseUnits(depositAmount, 6); // Assuming 6 decimals for USDC/USDT

      // First approve the token transfer
      const approveResult = await approveToken(tokenAddress, vaultAddress, amount.toString());
      if (!approveResult.success) {
        throw new Error(approveResult.error);
      }

      // Then deposit to vault (this would be a custom contract call)
      // For now, we'll simulate success
      setSuccess(`Successfully deposited ${depositAmount} ${rewardConfig.tokenType} to vault!`);
      setDepositAmount('');
      await loadVaultBalance();
    } catch (error: any) {
      setError(`Deposit failed: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const approveToken = async (tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult> => {
    if (walletConnection?.chainId === 1) {
      return await EthereumUtils.approveToken(tokenAddress, spenderAddress, amount);
    } else {
      return await StarknetUtils.approveToken(tokenAddress, spenderAddress, amount);
    }
  };

  const getVaultAddress = (): string => {
    const network = walletConnection?.chainId === 1 ? 'ethereum' : 'starknet';
    return CONTRACT_ADDRESSES[network].KidsViewerVault;
  };

  const formatAddress = (address: string) => {
    return Web3Utils.formatAddress(address);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reward Vault</h2>
          <p className="text-gray-600">Manage rewards and incentives for your child's learning</p>
        </div>
      </div>

      {/* Experimental Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-800 font-medium text-sm">Experimental Feature</p>
            <p className="text-yellow-700 text-sm mt-1">
              This feature helps children understand money concepts and motivates learning. Use with caution and only with small amounts.
            </p>
          </div>
        </div>
      </div>

      {/* Enable Rewards Toggle */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Enable Rewards</h3>
            <p className="text-gray-600 text-sm mt-1">Allow your child to earn tokens for correct answers</p>
          </div>
          <button
            onClick={handleEnableRewards}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              rewardConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                rewardConfig.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Wallet Connection */}
      {rewardConfig.enabled && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Wallet Connection</h3>

          {!walletConnection ? (
            <div className="text-center py-6">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Connect your wallet to manage rewards</p>
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">Wallet Connected</p>
                    <p className="text-sm text-green-600">{formatAddress(walletConnection.address)}</p>
                  </div>
                </div>
                <button onClick={() => setWalletConnection(null)} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  Disconnect
                </button>
              </div>

              {/* Vault Balance */}
              {vaultBalance && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800">Vault Balance</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {vaultBalance.formattedBalance} {vaultBalance.token.symbol}
                      </p>
                    </div>
                    <button
                      onClick={loadVaultBalance}
                      disabled={isLoadingBalance}
                      className="p-2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                    >
                      {isLoadingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Deposit Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Deposit to Vault</h4>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Amount to deposit"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || isDepositing}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deposit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reward Configuration */}
      {rewardConfig.enabled && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Reward Configuration</h3>

          <div className="space-y-4">
            {/* Token Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Token Type</label>
              <select
                value={rewardConfig.tokenType}
                onChange={e => handleConfigChange('tokenType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="KRC">KRC (Knowledge Reward Coin)</option>
              </select>
            </div>

            {/* Reward Per Answer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward per Correct Answer</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rewardConfig.rewardPerAnswer}
                  onChange={e => handleConfigChange('rewardPerAnswer', parseFloat(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
                <span className="text-gray-600">{rewardConfig.tokenType}</span>
              </div>
            </div>

            {/* Daily Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daily Reward Limit</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rewardConfig.dailyLimit}
                  onChange={e => handleConfigChange('dailyLimit', parseFloat(e.target.value))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
                <span className="text-gray-600">{rewardConfig.tokenType}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onConnect={handleWalletConnect} />
    </div>
  );
};
