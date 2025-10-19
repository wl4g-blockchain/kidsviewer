import React, { useEffect, useState } from 'react';
// import { useSessionData } from './providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Navigation } from './Navigation';
import { UserSwitcher } from './UserSwitcher';
import { useAppContext } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // const { data: session } = useSessionData();
  const { isDark } = useThemeStore();
  const t = useTranslation();
  const { viewMode } = useAppContext();
  const [isIOS, setIsIOS] = useState(false);

  // Detect if running in iOS environment
  useEffect(() => {
    const checkPlatform = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIPad = /ipad/.test(userAgent);
      const isIPhone = /iphone/.test(userAgent);
      const isIPod = /ipod/.test(userAgent);
      const isMacIntel = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      
      setIsIOS(isIPad || isIPhone || isIPod || isMacIntel);
    };
    
    checkPlatform();
  }, []);

  // Add safe area class names for iOS devices
  const safeAreaClass = isIOS ? 'ios-safe-area' : '';

  return (
    <div className={`min-h-screen relative ${safeAreaClass} ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Soft decorative background - responsive positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 sm:top-20 right-10 sm:right-20 w-20 h-20 sm:w-40 sm:h-40 rounded-full opacity-10 animate-pulse ${
          isDark ? 'bg-blue-400' : 'bg-blue-100'
        }`}></div>
        <div
          className={`absolute bottom-20 sm:bottom-40 left-10 sm:left-40 w-16 h-16 sm:w-32 sm:h-32 rounded-full opacity-8 animate-pulse ${
            isDark ? 'bg-purple-400' : 'bg-purple-100'
          }`}
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className={`absolute top-1/2 right-1/4 w-12 h-12 sm:w-24 sm:h-24 rounded-full opacity-12 animate-pulse ${
            isDark ? 'bg-indigo-400' : 'bg-indigo-100'
          }`}
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Header - responsive design with iOS safe area support */}
      <header className={`backdrop-blur-sm shadow-md relative z-10 ${isIOS ? 'pt-10' : ''} ${
        isDark 
          ? 'bg-gray-800/90 border-b border-gray-700' 
          : 'bg-white/90 border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - responsive sizing */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                  <span className="text-sm sm:text-lg">🎓</span>
                </div>
                <h1 className={`text-lg sm:text-2xl font-bold whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>{t('common.appName')}</h1>
              </div>
            </div>

            {/* Navigation - centered and responsive */}
            <div className="hidden lg:flex flex-1 justify-center px-8 max-w-md">
              <Navigation />
            </div>

            {/* Right side - responsive layout with fixed width to prevent overlap */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-[160px] justify-end">
              {true && <UserSwitcher />}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation - shown only on mobile when needed */}
      <div className={`lg:hidden backdrop-blur-sm relative z-10 ${
        isDark 
          ? 'bg-gray-800/95 border-b border-gray-700' 
          : 'bg-white/95 border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Navigation />
        </div>
      </div>

      {/* View mode indicator - helpful visual cue */}
      {true && (
        <div className={`border-b relative z-5 ${
          isDark 
            ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700' 
            : 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center">
              <div className={`text-sm font-medium flex items-center space-x-2 ${
                isDark ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {viewMode === 'parent' ? (
                  <>
                    <span>👑</span>
                    <span>{t('viewMode.parent')}</span>
                  </>
                ) : (
                  <>
                    <span>🧒</span>
                    <span>{t('viewMode.child')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content - responsive padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-0">{children}</main>

      {/* Footer - responsive design */}
      <footer className={`backdrop-blur-sm border-t mt-auto relative z-10 ${
        isDark 
          ? 'bg-gray-800/90 border-gray-700' 
          : 'bg-white/90 border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs">💖</span>
              </div>
              <p className={`text-xs sm:text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>&copy; 2025 KidsViewer - {t('common.appName')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
