// Piggy Bank Investment Management Component for Web3 integration

import React, { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, AlertCircle, CheckCircle, Loader2, Wallet, DollarSign, BarChart3 } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { Web3Utils } from '../../utils/web3/web3Utils';
import { WalletConnection, PiggyBankConfig, AaveProduct, PiggyBankBalance } from '../../types/web3';
import { getAppKit } from '../../config/appkit';

interface PiggyBankManagerProps {
  onConfigUpdate: (config: PiggyBankConfig) => void;
}

// Mock AAVE products data - in real implementation, this would be fetched from AAVE API
const MOCK_AAVE_PRODUCTS: AaveProduct[] = [
  {
    id: 'usdc-supply',
    name: 'USDC Supply',
    symbol: 'aUSDC',
    apr: 3.2,
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
  },
  {
    id: 'usdt-supply',
    name: 'USDT Supply',
    symbol: 'aUSDT',
    apr: 2.8,
    address: '0x0987654321098765432109876543210987654321',
    chainId: 1,
  },
  {
    id: 'dai-supply',
    name: 'DAI Supply',
    symbol: 'aDAI',
    apr: 4.1,
    address: '0x1111111111111111111111111111111111111111',
    chainId: 1,
  },
];

export const PiggyBankManager: React.FC<PiggyBankManagerProps> = ({ onConfigUpdate }) => {
  const { isDark } = useThemeStore();
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Piggy bank configuration state
  const [piggyBankConfig, setPiggyBankConfig] = useState<PiggyBankConfig>({
    enabled: false,
    investmentPercentage: 50,
    dailyMaxInvestment: 5,
    cumulativeMaxInvestment: 100,
    selectedAaveProduct: undefined,
    defiEnabled: false,
    approvedAaveProducts: [],
  });

  // Piggy bank balance state
  const [piggyBankBalance, setPiggyBankBalance] = useState<PiggyBankBalance | null>(null);

  // AAVE products state
  const [aaveProducts, setAaveProducts] = useState<AaveProduct[]>(MOCK_AAVE_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadPiggyBankConfig();
    loadAaveProducts();
  }, []);

  // Load piggy bank balance when wallet is connected
  useEffect(() => {
    if (walletConnection?.isConnected) {
      loadPiggyBankBalance();
    }
  }, [walletConnection]);

  const loadPiggyBankConfig = () => {
    const saved = localStorage.getItem('piggyBankConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setPiggyBankConfig(config);
        onConfigUpdate(config);
      } catch (error) {
        console.error('Failed to load piggy bank config:', error);
      }
    }
  };

  const savePiggyBankConfig = (config: PiggyBankConfig) => {
    localStorage.setItem('piggyBankConfig', JSON.stringify(config));
    onConfigUpdate(config);
  };

  const loadAaveProducts = async () => {
    setIsLoadingProducts(true);
    try {
      // In real implementation, fetch from AAVE API
      // For now, use mock data
      setAaveProducts(MOCK_AAVE_PRODUCTS);
    } catch (error) {
      console.error('Failed to load AAVE products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadPiggyBankBalance = async () => {
    if (!walletConnection?.isConnected) return;

    setError(null);

    try {
      // Mock balance data - in real implementation, fetch from contract
      const mockBalance: PiggyBankBalance = {
        token: {
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
          chainId: 1,
        },
        balance: '25.50',
        formattedBalance: '25.50',
        dailyEarnings: '0.08',
        totalEarnings: '2.45',
        investmentConfig: {
          isEnabled: true,
          maxInvestmentAmount: '1000.00',
          totalInvested: '0.00',
          approvedAaveProducts: ['USDC', 'USDT'],
        },
      };

      setPiggyBankBalance(mockBalance);
    } catch (error: any) {
      setError(`Failed to load piggy bank balance: ${error.message}`);
    }
  };

  const handleEnableInvestment = () => {
    const newConfig = { ...piggyBankConfig, enabled: !piggyBankConfig.enabled };
    setPiggyBankConfig(newConfig);
    savePiggyBankConfig(newConfig);
  };

  const handleConfigChange = (key: keyof PiggyBankConfig, value: any) => {
    const newConfig = { ...piggyBankConfig, [key]: value };
    setPiggyBankConfig(newConfig);
    savePiggyBankConfig(newConfig);
  };

  const handleSelectAaveProduct = (product: AaveProduct) => {
    handleConfigChange('selectedAaveProduct', product);
  };

  const formatAddress = (address: string) => {
    return Web3Utils.formatAddress(address);
  };

  const formatAPR = (apr: number) => {
    return `${apr.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
          <PiggyBank className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Piggy Bank Investment</h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Teach your child about investing and earning interest</p>
        </div>
      </div>

      {/* Enable Investment Toggle */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Enable Investment</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Allow your child's rewards to be automatically invested for earning interest
            </p>
          </div>
          <button
            onClick={handleEnableInvestment}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              piggyBankConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                piggyBankConfig.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Investment Configuration */}
      {piggyBankConfig.enabled && (
        <div className="space-y-6">
          {/* Wallet Connection */}
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Wallet Connection</h3>

            {!walletConnection ? (
              <div className="text-center py-6">
                <Wallet className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Connect your wallet to manage investments</p>
                 <button
                   onClick={async () => {
                     console.log('PiggyBankManager: Opening wallet-only AppKit');
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
                <div
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50'
                  }`}
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Wallet Connected</p>
                      <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{formatAddress(walletConnection.address)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWalletConnection(null)}
                    className={`text-sm underline transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>

                {/* Piggy Bank Balance */}
                {piggyBankBalance && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Total Balance</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {piggyBankBalance.formattedBalance} {piggyBankBalance.token.symbol}
                          </p>
                        </div>
                        <DollarSign className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Daily Earnings</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            +{piggyBankBalance.dailyEarnings} {piggyBankBalance.token.symbol}
                          </p>
                        </div>
                        <TrendingUp className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>Total Earnings</p>
                          <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                            +{piggyBankBalance.totalEarnings} {piggyBankBalance.token.symbol}
                          </p>
                        </div>
                        <BarChart3 className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Investment Settings */}
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Investment Settings</h3>

            <div className="space-y-4">
              {/* Investment Percentage */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Investment Percentage
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={piggyBankConfig.investmentPercentage}
                    onChange={e => handleConfigChange('investmentPercentage', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-lg font-semibold w-16 text-right ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {piggyBankConfig.investmentPercentage}%
                  </span>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Percentage of daily rewards to invest automatically
                </p>
              </div>

              {/* Daily Max Investment */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Daily Maximum Investment
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={piggyBankConfig.dailyMaxInvestment}
                    onChange={e => handleConfigChange('dailyMaxInvestment', parseFloat(e.target.value))}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    step="0.1"
                    min="0"
                  />
                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>USDC</span>
                </div>
              </div>

              {/* Cumulative Max Investment */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Cumulative Maximum Investment
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={piggyBankConfig.cumulativeMaxInvestment}
                    onChange={e => handleConfigChange('cumulativeMaxInvestment', parseFloat(e.target.value))}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    step="1"
                    min="0"
                  />
                  <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* AAVE Product Selection */}
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Select Investment Product</h3>

            {isLoadingProducts ? (
              <div className="text-center py-8">
                <Loader2 className={`w-8 h-8 mx-auto mb-4 animate-spin ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading investment products...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aaveProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectAaveProduct(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      piggyBankConfig.selectedAaveProduct?.id === product.id
                        ? isDark
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-blue-500 bg-blue-50'
                        : isDark
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.name}</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{product.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{formatAPR(product.apr)}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>APR</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {piggyBankConfig.selectedAaveProduct && (
              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50'}`}>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Selected Product</p>
                    <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {piggyBankConfig.selectedAaveProduct.name} ({formatAPR(piggyBankConfig.selectedAaveProduct.apr)} APR)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className={`border rounded-lg p-4 flex items-start ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className={`${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
        </div>
      )}
    </div>
  );
};
