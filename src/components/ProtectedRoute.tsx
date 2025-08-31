import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthUtil } from '../utils/authUtil';
import { useAuthStore } from '../stores/AuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Protected Route Component
 * Checks JWT validity before rendering child components
 * Redirects to login if token is expired or invalid
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser, logout, initializeAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      setShouldRedirect(false);

      try {
        // Check if JWT token is valid
        const isTokenValid = AuthUtil.isAuthenticated();

        if (!isTokenValid && requireAuth) {
          // Token is invalid or expired, clear auth data and redirect
          console.log('JWT token is invalid or expired, redirecting to login');
          await logout();
          setShouldRedirect(true);
          return;
        }

        // If we have a valid token but no user in store, reinitialize
        if (isTokenValid && !isAuthenticated) {
          console.log('Valid token found but no user in store, reinitializing auth');
          await initializeAuth();
        }

        // Additional check: verify user data consistency
        const storedUser = AuthUtil.getCurrentUser();
        if (requireAuth && (!currentUser || !storedUser)) {
          console.log('User data inconsistency detected, redirecting to login');
          await logout();
          setShouldRedirect(true);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (requireAuth) {
          await logout();
          setShouldRedirect(true);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname, requireAuth, isAuthenticated, currentUser, logout, initializeAuth]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 25%, #faf5ff 50%, #fdf2f8 75%, #fef7ed 100%)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          ></div>
          <p
            style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            🔒 验证身份中...
          </p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Redirect to login if authentication failed
  if (shouldRedirect && requireAuth) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Render children if authentication is valid or not required
  return <>{children}</>;
};

/**
 * Higher-order component for protecting routes
 */
export const withAuth = (Component: React.ComponentType, requireAuth = true) => {
  return (props: any) => (
    <ProtectedRoute requireAuth={requireAuth}>
      <Component {...props} />
    </ProtectedRoute>
  );
};
