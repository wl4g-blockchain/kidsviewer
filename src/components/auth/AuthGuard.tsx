'use client'

import { ReactNode } from 'react'
import { useSession } from '@/components/auth/AuthProvider'
import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { status } = useSession()

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return <Navigate to={redirectTo} replace />
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
