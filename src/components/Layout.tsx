import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Navigation } from './Navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserSwitcher } from './UserSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, viewMode } = useAuthStore();
  const t = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Soft decorative background - responsive positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-20 h-20 sm:w-40 sm:h-40 bg-blue-100 rounded-full opacity-10 animate-pulse"></div>
        <div
          className="absolute bottom-20 sm:bottom-40 left-10 sm:left-40 w-16 h-16 sm:w-32 sm:h-32 bg-purple-100 rounded-full opacity-8 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-12 h-12 sm:w-24 sm:h-24 bg-indigo-100 rounded-full opacity-12 animate-pulse"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Header - responsive design */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - responsive sizing */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                  <span className="text-sm sm:text-lg">🎓</span>
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 whitespace-nowrap">{t('common.appName')}</h1>
              </div>
            </div>

            {/* Navigation - centered and responsive */}
            <div className="hidden lg:flex flex-1 justify-center px-8">
              <Navigation />
            </div>

            {/* Right side - responsive layout with fixed width to prevent overlap */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-[280px] justify-end">
              <LanguageSwitcher />

              {currentUser && <UserSwitcher />}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation - shown only on mobile when needed */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Navigation />
        </div>
      </div>

      {/* View mode indicator - helpful visual cue */}
      {currentUser && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200 relative z-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center">
              <div className="text-sm font-medium text-purple-700 flex items-center space-x-2">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-5">{children}</main>

      {/* Footer - responsive design */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-100 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs">💖</span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">&copy; 2024 KidsViewer - {t('common.appName')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
