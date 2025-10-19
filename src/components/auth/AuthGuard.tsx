'use client'

import { ReactNode, useEffect } from 'react'
import { useSession } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { status } = useSession()
  const router = useRouter()

  // Check if we're in Next.js environment
  const isNextJS = typeof window !== 'undefined' && window.location.pathname.startsWith('/app')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      if (isNextJS) {
        router.push(redirectTo)
      }
      // For Vite mode, the redirect will be handled by React Router
    }
  }, [status, redirectTo, router, isNextJS])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // For Vite mode, use React Router Navigate
  if (status === 'unauthenticated' && !isNextJS) {
    return <Navigate to={redirectTo} replace />
  }

  // For Next.js mode, show loading while redirecting
  if (status === 'unauthenticated' && isNextJS) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}

// Hook for checking authentication status
export function useAuthGuard() {
  const { status } = useSession()
  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isUnauthenticated: status === 'unauthenticated',
  }
}
