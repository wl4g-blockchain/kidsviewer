import React from 'react'
import { useAuthStore } from '@stores/authStore'
import { useTranslation } from '@i18n/I18nProvider'
import { Navigation } from './Navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuthStore()
  const t = useTranslation()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {t('common.appName')}
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <Navigation />

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{currentUser.name}</span>
                    <span className="ml-2 text-gray-500">({t(`parent.${currentUser.userType}`)})</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 KidsViewer. {t('common.appName')} - {t('messages.welcome')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 