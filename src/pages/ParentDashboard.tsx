import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useTranslation } from '@i18n/I18nProvider'
import { Plus, Settings, BarChart3, Users, Clock, BookOpen } from 'lucide-react'
import { Child } from '@types'

export const ParentDashboard: React.FC = () => {
  const { currentUser, apiHandler } = useAuthStore()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslation()

  useEffect(() => {
    if (currentUser?.userType === 'parent') {
      loadChildren()
    }
  }, [currentUser])

  const loadChildren = async () => {
    try {
      const response = await apiHandler.getChildren(currentUser!.id)
      if (response.success && response.data) {
        setChildren(response.data)
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalUsage = () => {
    return children.reduce((total, child) => {
      const today = child.statistics.dailyUsage.find(
        usage => usage.date === new Date().toISOString().split('T')[0]
      )
      return total + (today?.totalTime || 0)
    }, 0)
  }

  const getTotalQuestions = () => {
    return children.reduce((total, child) => {
      return total + child.statistics.questionStats.totalAnswered
    }, 0)
  }

  const getAverageAccuracy = () => {
    if (children.length === 0) return 0
    const totalAccuracy = children.reduce((total, child) => {
      return total + child.statistics.questionStats.accuracyRate
    }, 0)
    return Math.round(totalAccuracy / children.length)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('parent.dashboard')}
        </h1>
        <p className="text-gray-600">
          Manage your children's screen time and learning progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{children.length}</div>
          <div className="text-sm text-gray-600">Children</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getTotalUsage()}</div>
          <div className="text-sm text-gray-600">Minutes Today</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getTotalQuestions()}</div>
          <div className="text-sm text-gray-600">Questions Answered</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{getAverageAccuracy()}%</div>
          <div className="text-sm text-gray-600">Average Accuracy</div>
        </div>
      </div>

      {/* Children List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Your Children</h2>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              <Plus className="w-4 h-4 mr-2" />
              {t('parent.addChild')}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {children.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No children added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first child to manage their screen time.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('parent.addChild')}
                </button>
              </div>
            </div>
          ) : (
            children.map((child) => (
              <div key={child.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {child.alias.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{child.alias}</h3>
                      <p className="text-sm text-gray-500">
                        {t(`parent.ageGroups.${child.ageGroup}`)} • {child.settings.timeLimit} {t('time.minutes')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Progress
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('parent.settings')}
                    </button>
                  </div>
                </div>

                {/* Child Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {child.statistics.questionStats.totalAnswered}
                    </div>
                    <div className="text-sm text-gray-500">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {child.statistics.questionStats.accuracyRate}%
                    </div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {child.statistics.learningProgress.level}
                    </div>
                    <div className="text-sm text-gray-500">Level</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Daily Reports</h3>
          <p className="text-gray-600 mb-4">
            View detailed reports of your children's daily usage and learning progress.
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
            View Reports
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Progress</h3>
          <p className="text-gray-600 mb-4">
            Track how your children are improving in different subjects over time.
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200">
            View Progress
          </button>
        </div>
      </div>
    </div>
  )
} 