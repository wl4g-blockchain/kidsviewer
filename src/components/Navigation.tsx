import React from 'react'
import { Link, useLocation } from 'react-router-dom'
// import { useSessionData } from './providers/AuthProvider'
import { useTranslation } from '../i18n/I18nProvider'
import { Users, Video, Settings, Crown, Baby } from 'lucide-react'

export const Navigation: React.FC = () => {
  // const { data: session } = useSessionData()
  const session = { user: { id: '1', name: 'Lyra', email: 'lyra@kidsviewer.app' } }; // Mock session
  const location = useLocation()
  const t = useTranslation()
  const viewMode: 'parent' | 'child' = 'parent' // Default to parent mode for now
  const activePerson: any = null // Will be implemented later

  if (!session?.user) return null

  // Define navigation items based on view mode
  const getNavigationItems = () => {
    if (viewMode === 'parent') {
      return [
        {
          name: t('navigation.parental'),
          href: '/parental-page',
          icon: Users,
          current: location.pathname === '/parental-page' || location.pathname === '/',
          showFor: 'parent'
        },
        {
          name: t('navigation.settings'),
          href: '/settings',
          icon: Settings,
          current: location.pathname === '/settings',
          showFor: 'parent'
        }
      ];
    } else {
      // Child view mode
      return [
        {
          name: t('navigation.person'),
          href: '/person-page',
          icon: Video,
          current: location.pathname === '/person-page' || location.pathname === '/',
          showFor: 'child'
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="flex flex-wrap justify-center lg:justify-center space-x-3 sm:space-x-6 lg:space-x-8">
      {navigationItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 border-b-2 text-xs sm:text-sm lg:text-base font-medium transition-colors duration-200 whitespace-nowrap ${
              item.current
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        )
      })}
      
      {/* View mode indicator in navigation - mobile only */}
      <div className="flex items-center px-2 py-2 text-xs text-gray-500 lg:hidden">
        {viewMode === 'parent' ? (
          <div className="flex items-center space-x-1">
            <Crown className="w-3 h-3 text-yellow-500" />
            <span>家长</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <Baby className="w-3 h-3 text-green-500" />
            <span>{activePerson?.name || '儿童'}</span>
          </div>
        )}
      </div>
    </nav>
  )
} 
 