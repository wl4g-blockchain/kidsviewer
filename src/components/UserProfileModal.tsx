import React, { useState, useEffect } from 'react';
// import { useTranslation } from '../i18n/I18nProvider';
import { useThemeStore } from '../stores/themeStore';
import { X, User, Mail, Github, Wallet, Calendar, Crown, Building, Hash } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  githubOpenid: string | null;
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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

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

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainDisplayName = (chain: string) => {
    const chainMap: { [key: string]: string } = {
      'ethereum': '以太坊',
      'starknet': 'Starknet',
      'polygon': 'Polygon',
      'bsc': 'BSC',
      'arbitrum': 'Arbitrum',
      'optimism': 'Optimism',
    };
    return chainMap[chain.toLowerCase()] || chain;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                账号信息
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看您的账户详细信息
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner"></div>
              <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                加载中...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className={`text-red-500 mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                加载失败: {error}
              </div>
              <button
                onClick={fetchUserProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重试
              </button>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      用户ID
                    </span>
                  </div>
                  <p className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.id}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-green-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      用户名
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.name}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      邮箱
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.email}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-4 h-4 text-purple-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      所属租户
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.tenantName}
                  </p>
                </div>
              </div>

              {/* GitHub Account */}
              {profile.githubOpenid && (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Github className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      绑定的 GitHub 账号
                    </span>
                  </div>
                  <p className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.githubOpenid}
                  </p>
                </div>
              )}

              {/* Wallet Addresses */}
              {profile.hasWallets && profile.wallets.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      绑定的钱包地址
                    </span>
                  </div>
                  <div className="space-y-2">
                    {profile.wallets.map((wallet, index) => (
                      <div key={index} className={`p-3 rounded border ${
                        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {getChainDisplayName(wallet.chain)}
                            </span>
                            <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              (Chain ID: {wallet.chainId})
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatWalletAddress(wallet.address)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Type */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    账户类型
                  </span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {profile.userType === 1 ? '主账户' : '子账户'}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      创建时间
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(profile.createDate)}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      更新时间
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(profile.updateDate)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className={`flex justify-end p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
