import React, { useState, useEffect, useRef } from 'react';
import { useSessionData } from './providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation, useLanguage } from '../i18n/I18nProvider';
import { Users, ChevronDown, LogOut, Crown, Sun, Moon, Monitor, Globe, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserSwitcher: React.FC = () => {
  const { data: session, signOut } = useSessionData();
  const { mode, setMode, isDark } = useThemeStore();
  const { currentLanguage, changeLanguage, isAutoLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();

  // Get current user from session
  const currentUser = session?.user;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  if (!currentUser) return null;

  return (
    <div className="relative z-[60]" ref={dropdownRef}>
      {/* Current user display button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] ${
          isDark ? 'bg-gray-800/90 border-gray-600 backdrop-blur-sm' : 'bg-white border-purple-200'
        }`}
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="flex-1 text-left min-w-[80px]">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className={`font-bold text-xs sm:text-sm lg:text-base truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {currentUser.name}
            </span>
            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
          </div>
          <div className={`text-xs sm:text-sm flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Users className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{t('navigation.parental')}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-gray-400' : 'text-gray-400'
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-[201px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[100]" style={{ top: '102px' }}>
          <div className="py-1">
            {/* User Info Section */}
            <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              {currentUser.email}
            </div>

            {/* Language Selection */}
            <div className="px-4 py-3 text-sm">
              <div className="flex items-center mb-2">
                <Globe className="w-4 h-4 mr-2" />
                {t('settings.languageSelection')}
              </div>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden w-fit">
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    currentLanguage === 'zh' && !isAutoLanguage
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  中
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    currentLanguage === 'en' && !isAutoLanguage
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('auto')}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    isAutoLanguage
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="px-4 py-3 text-sm">
              <div className="flex items-center mb-2">
                {mode === 'dark' ? (
                  <Moon className="w-4 h-4 mr-2" />
                ) : (
                  <Sun className="w-4 h-4 mr-2" />
                )}
                {t('settings.themeMode')}
              </div>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden w-fit">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    mode === 'light'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    mode === 'dark'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    mode === 'auto'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Actions */}
            {/* Sub Account Management - only show for main accounts (userType = 1) */}
            {String(currentUser.userType) === '1' && (
              <Link to="/sub-accounts" className="block">
                <button
                  className="w-full justify-start px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('userSwitcher.subAccountManagement')}
                </button>
              </Link>
            )}

            {/* Settings button */}
            <Link to="/settings" className="block">
              <button
                className="w-full justify-start px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('settings.title')}
              </button>
            </Link>

            {/* Logout button */}
            <button
              className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
