import React, { useState, useEffect } from 'react';
import { useSessionData } from '../components/providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Settings, Save, RefreshCw, Trash2, Shield, Globe, BookOpen, ArrowRight, Coins, PiggyBank } from 'lucide-react';
import { AppSettings, AppInfo } from '../types';
import { PlatformManagement } from './PlatformManagement';
import { QuestionManagement } from './QuestionManagement';
import { RewardVaultManager } from '../components/web3/RewardVaultManager';
import { PiggyBankManager } from '../components/web3/PiggyBankManager';

export const SettingsPage: React.FC = () => {
  const { data: session } = useSessionData();
  const { isDark } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'settings' | 'platforms' | 'questions' | 'rewards' | 'piggybank'>('settings');
  const [settings, setSettings] = useState<Partial<AppSettings> & { autoLock: boolean; dataSync: boolean }>({
    language: 'en',
    notifications: { enabled: true, sound: true, vibration: false },
    autoLock: true,
    dataSync: false,
    theme: 'light',
  });
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const t = useTranslation();

  // Get current user from session
  const currentUser = session?.user;

  useEffect(() => {
    loadSettings();
    loadAppInfo();
  }, []);

  const loadSettings = async () => {
    try {
      // TODO: Implement actual API call when backend is ready
      // const response = await apiHandler.getAppSettings();
      // if (response.errcode === '200' && response.data) {
      //   setSettings(prev => ({ ...prev, ...response.data }));
      // }
      console.log('Settings loading - API not implemented yet');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadAppInfo = async () => {
    try {
      // TODO: Implement actual API call when backend is ready
      // const response = await apiHandler.getAppInfo();
      // if (response.errcode === '200' && response.data) {
      //   setAppInfo(response.data);
      // }
      
      // Mock app info for now
      setAppInfo({
        version: '1.0.0',
        buildType: 'development',
        platform: 'Web'
      });
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call when backend is ready
      // const response = await apiHandler.updateAppSettings(settings);
      // if (response.errcode === '200') {
      //   console.log('Settings saved successfully');
      // }
      console.log('Settings saved successfully (mock)');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('确定要重置所有设置为默认值吗？')) {
      setSettings({
        language: 'en',
        notifications: { enabled: true, sound: true, vibration: false },
        autoLock: true,
        dataSync: false,
        theme: 'light',
      });
      await saveSettings();
    }
  };

  const clearData = async () => {
    if (window.confirm('确定要清除所有数据吗？此操作无法撤销。')) {
      try {
        // Clear localStorage directly since clearData is no longer available in the API
        localStorage.clear();
        // Redirect to auth page
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg mb-4">
            <span className="text-2xl">🔒</span>
          </div>
        </div>
        <p className="text-gray-600 text-lg">请先登录以访问设置。</p>
      </div>
    );
  }

  // Render management views
  if (currentView === 'platforms') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentView('settings')}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Settings
          </button>
        </div>
        <PlatformManagement />
      </div>
    );
  }

  if (currentView === 'questions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentView('settings')}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Settings
          </button>
        </div>
        <QuestionManagement />
      </div>
    );
  }

  if (currentView === 'rewards') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentView('settings')}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Settings
          </button>
        </div>
        <RewardVaultManager onConfigUpdate={() => {}} />
      </div>
    );
  }

  if (currentView === 'piggybank') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentView('settings')}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Settings
          </button>
        </div>
        <PiggyBankManager onConfigUpdate={() => {}} />
      </div>
    );
  }

  return (
    <div
      className={`space-y-10 py-8 relative ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}
    >
      {/* Soft decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 right-20 w-32 h-32 rounded-full opacity-15 animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-100'}`}
        ></div>
        <div
          className={`absolute bottom-32 left-32 w-28 h-28 rounded-full opacity-10 animate-pulse ${
            isDark ? 'bg-purple-400' : 'bg-purple-100'
          }`}
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className={`absolute top-1/2 right-40 w-20 h-20 rounded-full opacity-20 animate-pulse ${
            isDark ? 'bg-indigo-400' : 'bg-indigo-100'
          }`}
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Header */}
      <div className="text-center relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-lg mb-6">
            <span className="text-3xl">⚙️</span>
          </div>
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.title')}</h1>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('settings.subtitle')}</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Data Management */}
        <div
          className={`rounded-2xl shadow-md p-8 border lg:col-span-2 ${
            isDark ? 'bg-gray-800/80 border-gray-700 backdrop-blur-lg' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.dataManagement')}</h2>
          </div>

          {/* Management Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              onClick={() => setCurrentView('platforms')}
              className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {t('settings.platformManagement')}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('settings.platformManagementDesc')}</p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
                />
              </div>
            </div>

            <div
              onClick={() => setCurrentView('questions')}
              className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700'
                  : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {t('settings.questionManagement')}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('settings.questionManagementDesc')}</p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? 'text-green-400' : 'text-green-500'}`}
                />
              </div>
            </div>

            <div
              onClick={() => setCurrentView('rewards')}
              className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700'
                  : 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Reward Vault</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage learning rewards and incentives</p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}
                />
              </div>
            </div>

            <div
              onClick={() => setCurrentView('piggybank')}
              className={`rounded-xl p-6 border cursor-pointer hover:shadow-md transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-pink-700'
                  : 'bg-gradient-to-br from-pink-50 to-purple-100 border-pink-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mr-4">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Piggy Bank</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Investment and savings management</p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isDark ? 'text-pink-400' : 'text-pink-500'}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md ${
                isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? t('settings.saving') : t('settings.saveSettings')}
            </button>

            <button
              onClick={resetSettings}
              className={`inline-flex items-center justify-center px-6 py-3 border text-lg font-medium rounded-xl transition-all duration-200 ${
                isDark
                  ? 'border-orange-600 text-orange-300 bg-orange-900/30 hover:bg-orange-800/30 focus:ring-orange-500'
                  : 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 focus:ring-orange-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {t('settings.restoreDefaults')}
            </button>

            <button
              onClick={clearData}
              className={`inline-flex items-center justify-center px-6 py-3 border text-lg font-medium rounded-xl transition-all duration-200 ${
                isDark
                  ? 'border-red-600 text-red-300 bg-red-900/30 hover:bg-red-800/30 focus:ring-red-500'
                  : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {t('settings.clearData')}
            </button>
          </div>
        </div>

        {/* General Settings */}
        <div
          className={`rounded-2xl shadow-md p-8 border ${
            isDark ? 'bg-gray-800/80 border-gray-700 backdrop-blur-lg' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.generalSettings')}</h2>
          </div>

          <div className="space-y-8">
            {/* Language Setting */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('settings.languageSelection')}
              </label>
              <select
                value={settings.language}
                onChange={e => handleSettingChange('language', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                  isDark ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>

            {/* Theme Setting */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('settings.themeMode')}
              </label>
              <select
                value={settings.theme}
                onChange={e => handleSettingChange('theme', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 ${
                  isDark ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <option value="light">{t('settings.lightMode')}</option>
                <option value="dark">{t('settings.darkMode')}</option>
                <option value="auto">{t('settings.autoMode')}</option>
              </select>
            </div>

            {/* Notifications */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('settings.enableNotifications')}
                  </label>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.notificationsDesc')}</p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange('notifications', { ...settings.notifications, enabled: !settings.notifications?.enabled })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.notifications?.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.notifications?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div
          className={`rounded-2xl shadow-md p-8 border ${
            isDark ? 'bg-gray-800/80 border-gray-700 backdrop-blur-lg' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.securityPrivacy')}</h2>
          </div>

          <div className="space-y-8">
            {/* Auto Lock */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('settings.autoLock')}
                  </label>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.autoLockDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoLock', !settings.autoLock)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.autoLock ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.autoLock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Data Sync */}
            <div className={`rounded-xl p-6 border ${isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('settings.dataSync')}
                  </label>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.dataSyncDesc')}</p>
                </div>
                <button
                  onClick={() => handleSettingChange('dataSync', !settings.dataSync)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    settings.dataSync ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.dataSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div
        className={`rounded-2xl p-8 border relative z-10 ${
          isDark
            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
        }`}
      >
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.appInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className={`rounded-xl p-6 shadow-sm ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
            <div className="text-3xl mb-3">📱</div>
            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.version')}</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{appInfo?.version || 'Loading...'}</div>
          </div>
          <div className={`rounded-xl p-6 shadow-sm ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
            <div className="text-3xl mb-3">🔧</div>
            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.buildType')}</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {appInfo?.buildType === 'development' ? t('settings.developmentBuild') : appInfo?.buildType || 'Loading...'}
            </div>
          </div>
          <div className={`rounded-xl p-6 shadow-sm ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
            <div className="text-3xl mb-3">💻</div>
            <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('settings.runningPlatform')}</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{appInfo?.platform || 'Loading...'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
