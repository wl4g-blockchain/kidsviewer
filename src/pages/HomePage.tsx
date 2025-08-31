import React from 'react'
import { useAuthStore } from '@stores/authStore'
import { useTranslation } from '@i18n/I18nProvider'
import { Link } from 'react-router-dom'
import { Users, Video, Settings, BookOpen, Clock, Trophy } from 'lucide-react'

export const HomePage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const t = useTranslation()

  const features = [
    {
      icon: Clock,
      title: t('parent.timeLimit'),
      description: t('messages.welcome'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: BookOpen,
      title: t('questions.math'),
      description: t('questions.chinese'),
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Trophy,
      title: t('child.accuracy'),
      description: t('child.score'),
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const quickActions = [
    {
      title: t('navigation.parent'),
      description: t('parent.dashboard'),
      href: '/parent',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: t('navigation.child'),
      description: t('child.viewer'),
      href: '/child',
      icon: Video,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: t('navigation.settings'),
      description: t('parent.settings'),
      href: '/settings',
      icon: Settings,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('messages.welcome')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {currentUser?.userType === 'parent' 
            ? 'Manage your children\'s screen time and promote learning through educational challenges.'
            : 'Enjoy videos while learning through fun educational questions!'
          }
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} text-white mb-4`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.href}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${action.color} text-white mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Stats Section */}
      {currentUser?.userType === 'parent' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('parent.usageStats')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Children</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {currentUser?.userType === 'parent' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Getting Started
          </h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add Your Child</h3>
                <p className="text-gray-600">Create a profile for each child with their age and preferences</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Configure Settings</h3>
                <p className="text-gray-600">Set time limits, question types, and allowed video platforms</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Monitor Progress</h3>
                <p className="text-gray-600">Track learning progress and daily usage reports</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 