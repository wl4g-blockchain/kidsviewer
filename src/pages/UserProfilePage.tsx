import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { useThemeStore } from '../stores/themeStore';
import { User, Github, Wallet, Crown, ArrowLeft, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { isDark } = useThemeStore();
  const t = useTranslation();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use Vite proxy path instead of direct Next.js URL
      const response = await fetch('/api/user/profile', {
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
      const response = await fetch('/api/user/wallet/unlink', {
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
        alert(t('userProfile.unlinkFailed') || 'Failed to unlink wallet');
      }
    } catch (error) {
      console.error('Error unlinking wallet:', error);
      alert(t('userProfile.unlinkError') || 'Error unlinking wallet');
    } finally {
      setUnlinking(false);
    }
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
            <div className={`rounded-2xl shadow-lg border-2 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-6 w-6 text-blue-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('userProfile.basicInfo')}
                  </h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('userProfile.basicInfoDesc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.userId')}
                    </label>
                    <p className={`text-sm mt-1 font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.id}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.username')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.name}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.email')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.email}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.tenant')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{profile.tenantName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Accounts Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <LinkIcon className="h-6 w-6 text-green-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('userProfile.socialAccounts')}
                  </h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('userProfile.socialAccountsDesc')}
                </p>

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
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {account.providerName}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {account.openid}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                        }`}>
                          {t('userProfile.connected')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <LinkIcon className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('userProfile.noSocialAccounts')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Addresses Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Wallet className="h-6 w-6 text-purple-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('userProfile.walletAddresses')}
                  </h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('userProfile.walletAddressesDesc')}
                </p>

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
                            <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {wallet.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
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
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('userProfile.noWallets')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information Card */}
            <div className={`rounded-2xl shadow-lg border-2 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('userProfile.accountInfo')}
                  </h2>
                </div>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('userProfile.accountInfoDesc')}
                </p>

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
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDate(profile.createDate)}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('userProfile.updateTime')}
                    </label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDate(profile.updateDate)}
                    </p>
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
          <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
                  <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('userProfile.unlinkWallet')}
                </h3>
              </div>
              
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('userProfile.unlinkConfirmMessage')}
              </p>

              {unlinkDialog.wallet && (
                <div className={`p-4 rounded-lg border mb-6 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
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
                      <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {unlinkDialog.wallet.address}
                      </p>
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
    </div>
  );
};
