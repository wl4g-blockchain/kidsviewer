'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

// 动态导入前端组件，避免SSR问题
// 使用AppNextJS组件，专门为Next.js环境优化，不依赖React Router
const App = dynamic(() => import('../../../../src/AppNextJS').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading KidsViewer...</p>
      </div>
    </div>
  )
})

export default function AppPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Ensure hydration is complete
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // 在开发环境中，如果是SSR模式，重定向到Vite开发服务器
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // 检查是否是通过Next.js直接访问（而不是通过Vite代理）
      const isNextDirectAccess = window.location.port === '3000' && !window.location.search.includes('vite')
      
      if (isNextDirectAccess) {
        // 可以选择重定向到Vite开发服务器，或者渲染前端应用
        // window.location.href = 'http://localhost:5173'
        // 或者继续渲染前端应用
      }
    }
  }, [])

  // Show loading state until client-side hydration is complete
  if (!isClient || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return <App />
}
