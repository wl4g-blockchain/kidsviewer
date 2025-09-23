// Wallet connection modal component for Web3 integration

import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, Loader2, Download } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nProvider';
import { WalletLauncher, WalletInfo, PlatformUtils } from '../../utils/web3/walletLauncher';
import { SIWEService } from '../../services/siweService';
import { WalletConnection } from '../../types/web3';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connection: WalletConnection) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  const t = useTranslation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [walletStatuses, setWalletStatuses] = useState<Record<string, { isInstalled: boolean; isConnected: boolean }>>({});
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'starknet'>('ethereum');

  useEffect(() => {
    if (isOpen) {
      detectAvailableWallets();
    }
  }, [isOpen, selectedNetwork]);

  const detectAvailableWallets = async () => {
    try {
      // Get wallets for selected network
      const wallets = WalletLauncher.getWalletsForNetwork(selectedNetwork);
      setAvailableWallets(wallets);

      // Check installation and connection status for each wallet
      const statuses: Record<string, { isInstalled: boolean; isConnected: boolean }> = {};

      for (const wallet of wallets) {
        const isInstalled = await WalletLauncher.isWalletInstalled(wallet.id);
        const connectionStatus = await SIWEService.getConnectionStatus(wallet.id);

        statuses[wallet.id] = {
          isInstalled,
          isConnected: connectionStatus.isConnected,
        };
      }

      setWalletStatuses(statuses);
    } catch (error) {
      console.error('Failed to detect wallets:', error);
      setError('Failed to detect available wallets');
    }
  };

  const handleConnect = async (walletId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const wallet = availableWallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if wallet is installed
      const status = walletStatuses[walletId];
      if (!status?.isInstalled) {
        // Launch app store/play store to install wallet
        const installUrl = WalletLauncher.getWalletInstallUrl(walletId);
        if (PlatformUtils.isNative()) {
          await WalletLauncher.launchWallet(walletId, installUrl);
        } else {
          window.open(installUrl, '_blank');
        }
        return;
      }

      // If wallet is already connected, use existing connection
      if (status.isConnected) {
        const connectionStatus = await SIWEService.getConnectionStatus(walletId);
        if (connectionStatus.isConnected && connectionStatus.address) {
          const connection: WalletConnection = {
            address: connectionStatus.address,
            chainId: wallet.supportedNetworks.includes('ethereum')
              ? 1
              : Number(process.env.REACT_APP_STARKNET_CHAIN_ID || '0x534e5f4d41494e'),
            isConnected: true,
          };
          onConnect(connection);
          onClose();
          return;
        }
      }

      // Perform SIWE authentication
      const authResult = await SIWEService.authenticate(walletId);

      if (authResult.success && authResult.address) {
        const connection: WalletConnection = {
          address: authResult.address,
          chainId: wallet.supportedNetworks.includes('ethereum')
            ? 1
            : Number(process.env.REACT_APP_STARKNET_CHAIN_ID || '0x534e5f4d41494e'),
          isConnected: true,
        };
        onConnect(connection);
        onClose();
      } else {
        throw new Error(authResult.error || 'Authentication failed');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNetworkChange = (network: 'ethereum' | 'starknet') => {
    setSelectedNetwork(network);
    setError(null);
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

          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('web3.walletLauncher.selectNetwork')}</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleNetworkChange('ethereum')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedNetwork === 'ethereum' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('web3.walletLauncher.ethereum')}
              </button>
              <button
                onClick={() => handleNetworkChange('starknet')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedNetwork === 'starknet' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('web3.walletLauncher.starknet')}
              </button>
            </div>
          </div>

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
            {availableWallets.map(wallet => {
              const status = walletStatuses[wallet.id];
              const isInstalled = status?.isInstalled || false;
              const isConnected = status?.isConnected || false;

              return (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isConnecting}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-lg">{wallet.icon}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-800">{wallet.name}</h3>
                        <p className="text-sm text-gray-600">
                          {isConnected
                            ? t('web3.walletLauncher.walletStatus.connected')
                            : isInstalled
                            ? t('web3.walletLauncher.walletStatus.installed')
                            : t('web3.walletLauncher.walletStatus.notInstalled')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isConnecting && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {!isInstalled && <Download className="w-5 h-5 text-gray-400" />}
                      {isConnected && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                    </div>
                  </div>
                </button>
              );
            })}

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
