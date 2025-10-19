'use client'

import React, { useEffect, useState } from 'react'
import { useSessionData } from '../../../../src/components/providers/AuthProvider'

// SSR 兼容的设置页面组件
export function SSRSettingsPage() {
  const { data: session, status } = useSessionData()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 在服务端渲染或客户端未准备好时显示加载状态
  if (!isClient || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Settings...</p>
        </div>
      </div>
    )
  }

  // 如果用户未认证，显示登录提示
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-lg mb-4">
              <span className="text-2xl">🔒</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">需要登录</h2>
          <p className="text-gray-600 text-lg mb-6">请先登录以访问设置页面。</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
          >
            前往登录
          </button>
        </div>
      </div>
    )
  }

  // 用户已认证，动态导入实际的设置页面组件
  const SettingsPage = React.lazy(() => 
    import('../../../../src/pages/SettingsPage').then(mod => ({ default: mod.SettingsPage }))
  )

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Settings...</p>
          </div>
        </div>
      }
    >
      <SettingsPage />
    </React.Suspense>
  )
}

