// Wallet connection modal component for Web3 integration

import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nProvider';
import { EthereumUtils, StarknetUtils } from '../utils/web3Utils';
import { WalletConnection } from '../types/web3';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connection: WalletConnection) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  const t = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<('ethereum' | 'starknet')[]>([]);

  useEffect(() => {
    if (isOpen) {
      detectAvailableWallets();
    }
  }, [isOpen]);

  const detectAvailableWallets = async () => {
    const wallets: ('ethereum' | 'starknet')[] = [];

    if (window.ethereum) wallets.push('ethereum');
    if (window.starknet) wallets.push('starknet');

    setAvailableWallets(wallets);
  };

  const handleConnect = async (network: 'ethereum' | 'starknet') => {
    setIsConnecting(true);
    setError(null);

    try {
      let connection: WalletConnection;

      if (network === 'ethereum') {
        connection = await EthereumUtils.connectWallet();
        // Switch to mainnet if not already there
        if (connection.chainId !== 1) {
          await EthereumUtils.switchToEthereumMainnet();
          connection.chainId = 1;
        }
      } else {
        connection = await StarknetUtils.connectWallet();
      }

      onConnect(connection);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{t('web3.wallet.connect')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{t('web3.wallet.experimentalDesc')}</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">{t('web3.wallet.connectFailed')}</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-3">
            {/* Ethereum Option */}
            {availableWallets.includes('ethereum') && (
              <button
                onClick={() => handleConnect('ethereum')}
                disabled={isConnecting}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                      <span className="text-white font-bold text-lg">Ξ</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Ethereum</h3>
                      <p className="text-sm text-gray-600">MetaMask, WalletConnect, etc.</p>
                    </div>
                  </div>
                  {isConnecting && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                </div>
              </button>
            )}

            {/* Starknet Option */}
            {availableWallets.includes('starknet') && (
              <button
                onClick={() => handleConnect('starknet')}
                disabled={isConnecting}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                      <span className="text-white font-bold text-lg">⚡</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Starknet</h3>
                      <p className="text-sm text-gray-600">ArgentX, Braavos, etc.</p>
                    </div>
                  </div>
                  {isConnecting && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                </div>
              </button>
            )}

            {/* No Wallets Available */}
            {availableWallets.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('web3.wallet.noWalletFound')}</h3>
                <p className="text-gray-600 mb-4">{t('web3.wallet.noWalletFound')}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>For Ethereum: MetaMask, WalletConnect</p>
                  <p>For Starknet: ArgentX, Braavos</p>
                </div>
              </div>
            )}
          </div>

          {/* Experimental Notice */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">{t('web3.wallet.experimentalNotice')}</p>
                <p className="text-yellow-700 text-sm mt-1">{t('web3.wallet.experimentalDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
