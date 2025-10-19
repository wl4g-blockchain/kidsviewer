import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { useThemeStore } from '../stores/themeStore';
import { User, Github, Wallet, Crown, ArrowLeft, Link as LinkIcon, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWeb3Auth } from '../services/web3AuthService';
import { useAccount, useSignMessage } from 'wagmi';
import { AlertModal, AlertType } from '../components/AlertModal';

interface SocialAccount {
  provider: string;
  providerName: string;
  openid: string;
  icon: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  githubOpenid: string | null;
  socialAccounts: SocialAccount[];
  wallets: Array<{
    chain: string;
    address: string;
    chainId: number;
  }>;
  hasWallets: boolean;
  tenantId: string;
  tenantName: string;
  userType: number;
  createDate: string;
  updateDate: string;
}

export const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlinkDialog, setUnlinkDialog] = useState<{
    isOpen: boolean;
    wallet: { chain: string; address: string; chainId: number } | null;
  }>({ isOpen: false, wallet: null });
  const [unlinking, setUnlinking] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  const { isDark } = useThemeStore();
  const t = useTranslation();

  // Web3 auth service for wallet connection
  const { openAuthModal } = useWeb3Auth();
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Helper function to show alert modal
  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'info' });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Listen for wallet connection changes (similar to login page)
  useEffect(() => {
    console.log('🔄 Wallet state changed:', {
      isConnected,
      address,
      chainId,
      isWalletConnecting,
      linkingWallet,
    });

    if (isConnected && address && chainId && isWalletConnecting) {
      console.log('✅ Wallet connected successfully via wagmi');
      setIsWalletConnecting(false);
      // Wallet connected, proceed with linking
      linkWallet();
    }
  }, [isConnected, address, chainId, isWalletConnecting]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use Vite proxy path instead of direct Next.js URL
      const response = await fetch('/api/v1/user/profile', {
        credentials: 'include', // Include cookies for authentication
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChainDisplayName = (chain: string) => {
    const chainMap: { [key: string]: string } = {
      ethereum: 'Ethereum',
      starknet: 'Starknet',
      polygon: 'Polygon',
      bsc: 'BSC',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism',
    };
    return chainMap[chain.toLowerCase()] || chain;
  };

  const getSocialAccountIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'google':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
        );
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  const handleUnlinkWallet = (wallet: { chain: string; address: string; chainId: number }) => {
    setUnlinkDialog({ isOpen: true, wallet });
  };

  const confirmUnlinkWallet = async () => {
    if (!unlinkDialog.wallet) return;

    setUnlinking(true);
    try {
      const response = await fetch('/api/v1/user/wallet/unlink', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chain: unlinkDialog.wallet.chain,
          address: unlinkDialog.wallet.address,
          chainId: unlinkDialog.wallet.chainId,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh profile data
        await fetchUserProfile();
        setUnlinkDialog({ isOpen: false, wallet: null });
      } else {
        const error = await response.json();
        console.error('Failed to unlink wallet:', error);
        showAlert(
          t('web3.alert.error'),
          t('userProfile.unlinkFailed') || 'Failed to unlink wallet',
          'error'
        );
      }
    } catch (error) {
      console.error('Error unlinking wallet:', error);
      showAlert(
        t('web3.alert.error'),
        t('userProfile.unlinkError') || 'Error unlinking wallet',
        'error'
      );
    } finally {
      setUnlinking(false);
    }
  };

  const handleLinkWallet = async () => {
    // Set linking state and open wallet connection modal using AppKit (like login page)
    setLinkingWallet(true);
    setIsWalletConnecting(true);

    try {
      console.log('🔗 Opening wallet connection modal...');
      await openAuthModal();
      // The useEffect will handle the actual linking when wallet connects
    } catch (error) {
      console.error('Failed to open wallet connection:', error);
      setLinkingWallet(false);
      setIsWalletConnecting(false);
      showAlert(
        t('web3.alert.error'),
        t('userProfile.walletConnectionFailed') || 'Failed to open wallet connection',
        'error'
      );
    }
  };

  const linkWallet = async () => {
    if (!address || !chainId || !signMessageAsync) {
      setLinkingWallet(false);
      return;
    }

    try {
      // Generate message for signing
      const message = `Link wallet to KidsViewer account\nAddress: ${address}\nChain: ${chainId}\nTimestamp: ${Date.now()}`;

      // Sign message using wagmi
      const signature = await signMessageAsync({ message });

      // Get chain name from chain ID
      const chainName = getChainNameFromId(chainId);

      // Call link API
      const response = await fetch('/api/v1/user/wallet/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          message,
          chainName,
          chainId,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh profile data
        await fetchUserProfile();
        showAlert(
          t('web3.alert.success'),
          t('userProfile.walletLinkedSuccess') || 'Wallet linked successfully!',
          'success'
        );
      } else {
        const error = await response.json();
        console.error('Failed to link wallet:', error);
        showAlert(
          t('web3.alert.error'),
          error.error || t('userProfile.walletLinkFailed') || 'Failed to link wallet',
          'error'
        );
      }
    } catch (error) {
      console.error('Error linking wallet:', error);
      showAlert(
        t('web3.alert.error'),
        t('userProfile.walletLinkError') || 'Error linking wallet',
        'error'
      );
    } finally {
      setLinkingWallet(false);
    }
  };

  const getChainNameFromId = (chainId: number): string => {
    const chainMap: { [key: number]: string } = {
      1: 'ethereum',
      11155111: 'sepolia',
      42161: 'arbitrum',
      137: 'polygon',
      10: 'optimism',
      43114: 'avalanche',
      43113: 'avalancheFuji',
      56: 'bsc',
      97: 'bscTestnet',
      8453: 'base',
      592: 'astar',
      3776: 'astarZkEVM',
      6038361: 'astarZkyoto',
      1802203764: 'kakarotStarknetSepolia',
    };
    return chainMap[chainId] || 'ethereum';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/parental-page"
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('userProfile.title')}</h1>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('userProfile.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
            <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.loading')}</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className={`text-red-500 mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {t('userProfile.loadError')}: {error}
            </div>
            <button onClick={fetchUserProfile} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              {t('userProfile.retry')}
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-6 w-6 text-blue-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('userProfile.basicInfo')}</h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.basicInfoDesc')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('userProfile.userId')}</label>
                    <p className={`text-sm mt-1 font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.id}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.username')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.name}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('userProfile.email')}</label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.email}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('userProfile.tenant')}</label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.tenantName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Accounts Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <LinkIcon className="h-6 w-6 text-green-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('userProfile.socialAccounts')}</h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.socialAccountsDesc')}</p>

                {profile.socialAccounts && profile.socialAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {profile.socialAccounts.map((account, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getSocialAccountIcon(account.provider)}
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{account.providerName}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{account.openid}</p>
                          </div>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {t('userProfile.connected')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <LinkIcon className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.noSocialAccounts')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Addresses Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-6 w-6 text-purple-500" />
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('userProfile.walletAddresses')}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isConnected && address && (
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('userProfile.connectedWallet')}: {address.slice(0, 6)}...{address.slice(-4)}
                      </div>
                    )}
                    <button
                      onClick={handleLinkWallet}
                      disabled={linkingWallet}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {linkingWallet
                          ? isWalletConnecting
                            ? t('userProfile.connecting')
                            : t('userProfile.linking')
                          : t('userProfile.linkNewWallet')}
                      </span>
                    </button>
                  </div>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.walletAddressesDesc')}</p>

                {profile.wallets && profile.wallets.length > 0 ? (
                  <div className="space-y-3">
                    {profile.wallets.map((wallet, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('userProfile.chainName')}
                            </label>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {getChainDisplayName(wallet.chain)} ({wallet.chainId})
                            </p>
                          </div>
                          <div>
                            <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t('userProfile.address')}
                            </label>
                            <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{wallet.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {t('userProfile.linked')}
                          </div>
                          <button
                            onClick={() => handleUnlinkWallet(wallet)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                                : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={t('userProfile.unlinkWallet')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.noWallets')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('userProfile.accountInfo')}</h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.accountInfoDesc')}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.accountType')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {profile.userType === 1 ? t('userProfile.mainAccount') : t('userProfile.subAccount')}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.createTime')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(profile.createDate)}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.updateTime')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(profile.updateDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Unlink Wallet Confirmation Dialog */}
      {unlinkDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
                  <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('userProfile.unlinkWallet')}</h3>
              </div>

              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('userProfile.unlinkConfirmMessage')}</p>

              {unlinkDialog.wallet && (
                <div className={`p-4 rounded-lg border mb-6 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('userProfile.chainName')}
                      </label>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getChainDisplayName(unlinkDialog.wallet.chain)} ({unlinkDialog.wallet.chainId})
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('userProfile.address')}
                      </label>
                      <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{unlinkDialog.wallet.address}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setUnlinkDialog({ isOpen: false, wallet: null })}
                  disabled={unlinking}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors disabled:opacity-50`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmUnlinkWallet}
                  disabled={unlinking}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {unlinking ? t('userProfile.unlinking') : t('userProfile.confirmUnlink')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText={t('web3.alert.confirm')}
      />
    </div>
  );
};
