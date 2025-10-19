// Reward Vault Management Component for Web3 integration

import React, { useState, useEffect } from 'react';
import { Coins, Wallet, AlertCircle, CheckCircle, Loader2, ExternalLink, Link, Unlink, Globe } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { Web3Utils } from '@/utils/web3/web3Utils';
import { getAppKit } from '@/config/appkit';
import {
  WalletConnection,
  RewardConfig,
  VaultBalance,
  WithdrawalRequest,
  InvestmentConfig,
  KRCHoldings
} from '@/types/web3';
import { web3Service } from '@/services/web3Service';
// import { useSessionData } from '@/components/auth/AuthProvider';

interface RewardVaultManagerProps {
  onConfigUpdate: (config: RewardConfig) => void;
}

export const RewardVaultManager: React.FC<RewardVaultManagerProps> = ({ onConfigUpdate }) => {
  const { isDark } = useThemeStore();
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get auth state from store
  // const { .* } = useAuthStore();

  // Reward configuration state
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>({
    enabled: false,
    tokenType: 'USDC',
    rewardPerAnswer: 0.1,
    dailyLimit: 10,
    vaultAddress: undefined,
    settlementMode: 'realtime', // New: reward settlement mode
  });

  // Vault balance state
  const [vaultBalance, setVaultBalance] = useState<VaultBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // New state for enhanced functionality
  const [withdrawalRequests, _setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [investmentConfigs, _setInvestmentConfigs] = useState<Map<string, InvestmentConfig>>(new Map());
  const [krcHoldings, _setKrcHoldings] = useState<KRCHoldings | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [availableAaveProducts, setAvailableAaveProducts] = useState<any[]>([]);

  // Load saved configuration on mount
  useEffect(() => {
    loadRewardConfig();
  }, []);

  // Load vault balance when wallet is connected
  useEffect(() => {
    if (walletConnection?.isConnected) {
      loadVaultBalance();
      loadKrcHoldings();
      loadAvailableAaveProducts();
    }
  }, [walletConnection]);

  // Update wallet connection from auth store
  useEffect(() => {
    // TODO: Implement wallet connection logic
    // const currentWallet = getWalletConnection();
    // if (currentWallet) {
    //   setWalletConnection(currentWallet);
    // }
  }, []);

  // Load withdrawal requests when child is selected
  useEffect(() => {
    if (selectedChild && walletConnection?.isConnected) {
      loadWithdrawalRequests();
      loadInvestmentConfig();
    }
  }, [selectedChild, walletConnection]);

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
      const tokenAddress = await getTokenAddress();
      const vaultBalance = await web3Service.getVaultBalance(tokenAddress, walletConnection.address);

      setVaultBalance(vaultBalance);
    } catch (error: any) {
      setError(`Failed to load vault balance: ${error.message}`);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getTokenAddress = async (): Promise<string> => {
    if (!walletConnection) return '';
    return await web3Service.getTokenAddress(rewardConfig.tokenType);
  };



  const handleBindWallet = async () => {
    try {
      // TODO: Implement wallet binding logic
      setSuccess('Wallet bound successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to bind wallet');
    }
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
      const tokenAddress = await getTokenAddress();
      
      // Use Web3Service for deposit
      const result = await web3Service.depositToVault(tokenAddress, depositAmount);
      
      if (result.success) {
        setSuccess(`Successfully deposited ${depositAmount} ${rewardConfig.tokenType} to vault!`);
        setDepositAmount('');
        await loadVaultBalance();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setError(`Deposit failed: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };



  const formatAddress = (address: string) => {
    return Web3Utils.formatAddress(address);
  };

  // New methods for enhanced functionality
  const loadKrcHoldings = async () => {
    if (!walletConnection?.isConnected) return;

    try {
      // TODO: Implement KRC holdings loading
      // const holdings = await web3Service.getKRCHoldings(walletConnection.address);
      // _setKrcHoldings(holdings);
      console.log('KRC holdings loading not implemented yet');
    } catch (error: any) {
      console.error('Failed to load KRC holdings:', error);
    }
  };

  const loadAvailableAaveProducts = async () => {
    try {
      const products = await web3Service.getAvailableAaveProducts();
      setAvailableAaveProducts(products);
    } catch (error: any) {
      console.error('Failed to load AAVE products:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    if (!selectedChild || !walletConnection?.isConnected) return;

    try {
      // TODO: Implement withdrawal requests loading
      // const requests = await web3Service.getWithdrawalRequests(selectedChild);
      // _setWithdrawalRequests(requests);
      console.log('Withdrawal requests loading not implemented yet');
    } catch (error: any) {
      console.error('Failed to load withdrawal requests:', error);
    }
  };

  const loadInvestmentConfig = async () => {
    if (!selectedChild || !walletConnection?.isConnected) return;

    try {
      // TODO: Implement investment config loading
      // const config = await web3Service.getInvestmentConfig(selectedChild);
      // _setInvestmentConfigs(prev => new Map(prev.set(selectedChild, config)));
      console.log('Investment config loading not implemented yet');
    } catch (error: any) {
      console.error('Failed to load investment config:', error);
    }
  };

  const handleApproveWithdrawal = async (_requestId: number) => {
    try {
      // TODO: Implement withdrawal approval
      // const result = await web3Service.approveWithdrawal(_requestId);
      // if (result.success) {
      //   setSuccess('Withdrawal _approved successfully!');
      //   await loadWithdrawalRequests();
      // } else {
      //   setError(result.error || 'Failed to approve withdrawal');
      // }
      console.log('Withdrawal approval not implemented yet');
    } catch (error: any) {
      setError(`Failed to approve withdrawal: ${error.message}`);
    }
  };

  const handleSetInvestmentConfig = async (_childAddress: string, _enabled: boolean, _maxAmount: string) => {
    try {
      // TODO: Implement investment config setting
      // const result = await web3Service.setInvestmentConfig(_childAddress, _enabled, _maxAmount);
      // if (result.success) {
      //   setSuccess('Investment configuration updated successfully!');
      //   await loadInvestmentConfig();
      // } else {
      //   setError(result.error || 'Failed to update investment config');
      // }
      console.log('Investment config setting not implemented yet');
    } catch (error: any) {
      setError(`Failed to update investment config: ${error.message}`);
    }
  };

  const handleApproveAaveProduct = async (_childAddress: string, _aaveProductAddress: string, _approved: boolean) => {
    try {
      // TODO: Implement AAVE product approval
      // const result = await web3Service.approveAaveProduct(_childAddress, _aaveProductAddress, _approved);
      // if (result.success) {
      //   setSuccess(`AAVE product ${_approved ? '_approved' : 'dis_approved'} successfully!`);
      //   await loadInvestmentConfig();
      // } else {
      //   setError(result.error || 'Failed to update AAVE product approval');
      // }
      console.log('AAVE product approval not implemented yet');
    } catch (error: any) {
      setError(`Failed to update AAVE product approval: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Reward Vault</h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage rewards and incentives for your child's learning</p>
        </div>
      </div>

      {/* Experimental Notice */}
      <div className={`border rounded-xl p-4 ${
        isDark 
          ? 'bg-yellow-900/30 border-yellow-700' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className={`font-medium text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>Experimental Feature</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              This feature helps children understand money concepts and motivates learning. Use with caution and only with small amounts.
            </p>
          </div>
        </div>
      </div>

      {/* Enable Rewards Toggle */}
      <div className={`rounded-xl p-6 border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Enable Rewards</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Allow your child to earn tokens for correct answers</p>
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
        <div className={`rounded-xl p-6 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Wallet Connection</h3>

          {/* Show different UI based on auth method */}
          {false ? (
            /* Social/Email login - show wallet binding option */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                isDark 
                  ? 'bg-blue-900/30 border border-blue-700' 
                  : 'bg-blue-50'
              }`}>
                <div className="flex items-center mb-2">
                  <Globe className="w-5 h-5 text-blue-500 mr-2" />
                  <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Email Login Detected</p>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  You logged in with email. To manage rewards, you need to bind a wallet.
                </p>

                {!walletConnection ? (
                  <button
                    onClick={handleBindWallet}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Bind Wallet
                  </button>
                ) : (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark 
                      ? 'bg-green-900/30 border border-green-700' 
                      : 'bg-green-50'
                  }`}>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Wallet Bound</p>
                        <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{formatAddress(walletConnection?.address || '')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setWalletConnection(null)}
                      className={`text-sm underline flex items-center gap-1 ${
                        isDark 
                          ? 'text-gray-400 hover:text-gray-300' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Unlink className="w-3 h-3" />
                      Unbind
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : /* Traditional wallet login */
          !walletConnection ? (
            <div className="text-center py-6">
              <Wallet className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Connect your wallet to manage rewards</p>
                <button
                  onClick={async () => {
                    console.log('RewardVaultManager: Opening wallet-only AppKit');
                    try {
                      const appKit = await getAppKit();
                      await appKit.open();
                    } catch (error) {
                      console.error('Failed to open wallet connection:', error);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
                >
                  Connect Wallet
                </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${
                isDark 
                  ? 'bg-green-900/30 border border-green-700' 
                  : 'bg-green-50'
              }`}>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Wallet Connected</p>
                    <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{formatAddress(walletConnection.address)}</p>
                  </div>
                </div>
                <button onClick={() => setWalletConnection(null)} className={`text-sm underline ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                  Disconnect
                </button>
              </div>

              {/* Vault Balance */}
              {vaultBalance && (
                <div className={`p-4 rounded-lg ${
                  isDark 
                    ? 'bg-blue-900/30 border border-blue-700' 
                    : 'bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Vault Balance</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {vaultBalance.formattedBalance} {vaultBalance.token.symbol}
                      </p>
                    </div>
                    <button
                      onClick={loadVaultBalance}
                      disabled={isLoadingBalance}
                      className={`p-2 disabled:opacity-50 ${
                        isDark 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-500 hover:text-blue-700'
                      }`}
                    >
                      {isLoadingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Deposit Section */}
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Deposit to Vault</h4>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Amount to deposit"
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
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
        <div className={`rounded-xl p-6 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Reward Configuration</h3>

          <div className="space-y-4">
            {/* Token Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Token Type</label>
              <select
                value={rewardConfig.tokenType}
                onChange={e => handleConfigChange('tokenType', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="KRC">KRC (Knowledge Reward Coin)</option>
              </select>
            </div>

            {/* Reward Per Answer */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reward per Correct Answer</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rewardConfig.rewardPerAnswer}
                  onChange={e => handleConfigChange('rewardPerAnswer', parseFloat(e.target.value))}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  }`}
                  step="0.01"
                  min="0"
                />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{rewardConfig.tokenType}</span>
              </div>
            </div>

            {/* Daily Limit */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Daily Reward Limit</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={rewardConfig.dailyLimit}
                  onChange={e => handleConfigChange('dailyLimit', parseFloat(e.target.value))}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  }`}
                  step="0.1"
                  min="0"
                />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{rewardConfig.tokenType}</span>
              </div>
            </div>

            {/* Settlement Mode */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reward Settlement Mode</label>
              <select
                value={rewardConfig.settlementMode}
                onChange={e => handleConfigChange('settlementMode', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
              >
                <option value="realtime">Real-time Settlement</option>
                <option value="daily">Daily Settlement (Reduces Gas Fees)</option>
              </select>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {rewardConfig.settlementMode === 'realtime'
                  ? 'Rewards are distributed immediately after each correct answer'
                  : 'Rewards are accumulated and distributed once per day to reduce transaction costs'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KRC Holdings Display */}
      {krcHoldings && (
        <div className={`rounded-xl p-6 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>KRC Platform Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-lg p-4 ${
              isDark 
                ? 'bg-blue-900/30 border border-blue-700' 
                : 'bg-blue-50'
            }`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{krcHoldings.balance} KRC</div>
              <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Balance</div>
            </div>
            <div className={`rounded-lg p-4 ${
              isDark 
                ? 'bg-green-900/30 border border-green-700' 
                : 'bg-green-50'
            }`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{krcHoldings.feeDiscount / 100}%</div>
              <div className={`text-sm ${isDark ? 'text-green-300' : 'text-green-800'}`}>Fee Discount</div>
            </div>
            <div className={`rounded-lg p-4 ${
              isDark 
                ? 'bg-purple-900/30 border border-purple-700' 
                : 'bg-purple-50'
            }`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>+{krcHoldings.yieldBoost / 100}%</div>
              <div className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Yield Boost</div>
            </div>
            <div className={`rounded-lg p-4 ${
              isDark 
                ? 'bg-orange-900/30 border border-orange-700' 
                : 'bg-orange-50'
            }`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{krcHoldings.governancePower} KRC</div>
              <div className={`text-sm ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>Voting Power</div>
            </div>
          </div>
        </div>
      )}

      {/* Child Management */}
      {walletConnection?.isConnected && (
        <div className={`rounded-xl p-6 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Child Management</h3>

          {/* Child Selection */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Select Child</label>
            <select
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select a child...</option>
              {/* In a real app, this would be populated from the user's children */}
              <option value="child1">Child 1</option>
              <option value="child2">Child 2</option>
            </select>
          </div>

          {/* Withdrawal Requests */}
          {selectedChild && withdrawalRequests.length > 0 && (
            <div className="mb-6">
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Pending Withdrawal Requests</h4>
              <div className="space-y-3">
                {withdrawalRequests.map(request => (
                  <div key={request.id} className={`rounded-lg p-4 ${
                    isDark 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {request.amount} {request.token}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{request.reason}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(request.timestamp * 1000).toLocaleString()}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveWithdrawal(request.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            /* Handle reject */
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment Configuration */}
          {selectedChild && (
            <div>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>DeFi Investment Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Enable DeFi Investment</div>
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Allow child to invest in AAVE products</div>
                  </div>
                  <button
                    onClick={() => {
                      const currentConfig = investmentConfigs.get(selectedChild);
                      handleSetInvestmentConfig(selectedChild, !currentConfig?.isEnabled, currentConfig?.maxInvestmentAmount || '100');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      investmentConfigs.get(selectedChild)?.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        investmentConfigs.get(selectedChild)?.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* AAVE Product Approvals */}
                {investmentConfigs.get(selectedChild)?.isEnabled && (
                  <div>
                    <div className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Approved AAVE Products</div>
                    <div className="space-y-2">
                      {availableAaveProducts.map(product => (
                        <div key={product.id} className={`flex items-center justify-between rounded-lg p-3 ${
                          isDark 
                            ? 'bg-gray-700 border border-gray-600' 
                            : 'bg-gray-50'
                        }`}>
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.name}</div>
                            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>APR: {product.apr}%</div>
                          </div>
                          <button
                            onClick={() => handleApproveAaveProduct(selectedChild, product.address, true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className={`border rounded-lg p-4 flex items-start ${
          isDark 
            ? 'bg-red-900/30 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className={`${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
        </div>
      )}

      {success && (
        <div className={`border rounded-lg p-4 flex items-start ${
          isDark 
            ? 'bg-green-900/30 border-green-700' 
            : 'bg-green-50 border-green-200'
        }`}>
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className={`${isDark ? 'text-green-300' : 'text-green-800'}`}>{success}</p>
        </div>
      )}
    </div>
  );
};
