import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/AuthStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Settings, Save, RefreshCw, Trash2, Shield } from 'lucide-react';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { currentUser, apiHandler } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<Partial<AppSettings> & { autoLock: boolean; dataSync: boolean }>({
    language: 'en',
    notifications: { enabled: true, sound: true, vibration: false },
    autoLock: true,
    dataSync: false,
    theme: 'light',
  });
  const t = useTranslation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiHandler.getAppSettings();
      if (response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiHandler.updateAppSettings(settings);
      if (response.success) {
        // Show success message
        console.log('Settings saved successfully');
      }
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

  return (
    <div className="space-y-10 py-8 relative">
      {/* Soft decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-100 rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-purple-100 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-40 w-20 h-20 bg-indigo-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="text-center relative z-10">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-lg mb-6">
            <span className="text-3xl">⚙️</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          {t('navigation.settings')}
        </h1>
        <p className="text-lg text-gray-600">个性化你的学习体验</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">基础设置</h2>
          </div>

          <div className="space-y-8">
            {/* Language Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                语言选择
              </label>
              <select
                value={settings.language}
                onChange={e => handleSettingChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-gray-50"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>

            {/* Theme Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                主题模式
              </label>
              <select
                value={settings.theme}
                onChange={e => handleSettingChange('theme', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-gray-50"
              >
                <option value="light">明亮模式</option>
                <option value="dark">深色模式</option>
                <option value="auto">自动切换</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    启用通知
                  </label>
                  <p className="text-sm text-gray-500 mt-1">接收重要事件的通知提醒</p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', { ...settings.notifications, enabled: !settings.notifications?.enabled })}
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
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">安全隐私</h2>
          </div>

          <div className="space-y-8">
            {/* Auto Lock */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    自动锁定
                  </label>
                  <p className="text-sm text-gray-500 mt-1">闲置时自动锁定应用</p>
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
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    数据同步
                  </label>
                  <p className="text-sm text-gray-500 mt-1">在多设备间同步数据</p>
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

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 lg:col-span-2">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">数据管理</h2>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? '保存中...' : '保存设置'}
            </button>

            <button
              onClick={resetSettings}
              className="inline-flex items-center justify-center px-6 py-3 border border-orange-300 text-lg font-medium rounded-xl text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              恢复默认
            </button>

            <button
              onClick={clearData}
              className="inline-flex items-center justify-center px-6 py-3 border border-red-300 text-lg font-medium rounded-xl text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              清除数据
            </button>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 relative z-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">应用信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📱</div>
            <div className="font-medium text-gray-800 mb-1">版本号</div>
            <div className="text-gray-600">1.0.0</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🔧</div>
            <div className="font-medium text-gray-800 mb-1">构建类型</div>
            <div className="text-gray-600">开发版</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">💻</div>
            <div className="font-medium text-gray-800 mb-1">运行平台</div>
            <div className="text-gray-600">Electron</div>
          </div>
        </div>
      </div>
    </div>
  );
};
