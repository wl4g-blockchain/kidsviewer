import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from '../i18n/I18nProvider'
import { Home, Users, Video, Settings, User } from 'lucide-react'

export const Navigation: React.FC = () => {
  const { currentUser } = useAuthStore()
  const location = useLocation()
  const t = useTranslation()

  if (!currentUser) return null

  const navigationItems = [
    {
      name: t('navigation.home'),
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: t('navigation.parental'),
      href: '/parental',
      icon: Users,
      current: location.pathname === '/parental',
      showFor: 'parental'
    },
    {
      name: t('navigation.person'),
      href: '/person',
      icon: Video,
      current: location.pathname === '/person',
      showFor: 'person'
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ]

  const filteredItems = navigationItems.filter(item => 
    !item.showFor || item.showFor === currentUser.userType
  )

  return (
    <nav className="flex space-x-8">
      {filteredItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
              item.current
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
} 
 