'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { nextAuthAPI } from '../../lib/nextauth-api';
import { updateAuthStatus } from '../../utils/apiInterceptor';

interface Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    tenantId: number;
    userType?: string;
    tenant?: {
      id: number;
      properties?: any;
    };
  };
  expires: string;
}

interface AuthContextType {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signIn: (provider: string, credentials?: any) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const sessionData = await nextAuthAPI.getSession();
        console.log('Session data received:', sessionData);

        // Check if session has user data (not just empty object)
        if (sessionData && sessionData.user && sessionData.user.id) {
          setSession(sessionData);
          setStatus('authenticated');
          updateAuthStatus(true);
        } else {
          console.log('No valid session found, setting unauthenticated');
          setSession(null);
          setStatus('unauthenticated');
          updateAuthStatus(false);
          
          // Only redirect if we're not on the auth page and not on the root page
          if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
            console.log('No valid session, redirecting to login page');
            window.location.href = '/auth';
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setSession(null);
        setStatus('unauthenticated');
        updateAuthStatus(false);
        
        // Only redirect if we're not on the auth page and not on the root page
        if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
          console.log('Session check failed, redirecting to login page');
          window.location.href = '/auth';
        }
      }
    };

    checkSession();

    // Listen for custom auth session update events
    const handleAuthSessionUpdate = (event: CustomEvent) => {
      const { session, status } = event.detail;
      console.log('Received auth session update:', { session, status });
      setSession(session);
      setStatus(status);
      updateAuthStatus(status === 'authenticated');
    };

    // Listen for authentication error events
    const handleAuthError = (event: CustomEvent) => {
      console.log('Received auth error event:', event.detail);
      // Clear session and set status to unauthenticated
      setSession(null);
      setStatus('unauthenticated');
      updateAuthStatus(false);
      
      // Dispatch session update event to notify other components
      const sessionUpdateEvent = new CustomEvent('auth-session-update', {
        detail: { session: null, status: 'unauthenticated' }
      });
      window.dispatchEvent(sessionUpdateEvent);
    };

    window.addEventListener('auth-session-update', handleAuthSessionUpdate as EventListener);
    window.addEventListener('auth-error', handleAuthError as EventListener);

    return () => {
      window.removeEventListener('auth-session-update', handleAuthSessionUpdate as EventListener);
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, []);

  const signIn = async (provider: string, credentials?: any) => {
    try {
      const result = await nextAuthAPI.signIn(provider, credentials);
      if (result.ok) {
        // Refresh session after successful sign in
        const sessionData = await nextAuthAPI.getSession();
        if (sessionData) {
          setSession(sessionData);
          setStatus('authenticated');
          updateAuthStatus(true);
        }
      }
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      return { ok: false, error: 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      await nextAuthAPI.signOut();
      
      setSession(null);
      setStatus('unauthenticated');
      updateAuthStatus(false);
      
      // Dispatch session update event to notify other components
      const sessionUpdateEvent = new CustomEvent('auth-session-update', {
        detail: { session: null, status: 'unauthenticated' }
      });
      window.dispatchEvent(sessionUpdateEvent);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    data: session,
    status,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSession must be used within an AuthProvider');
  }
  return context;
}

// Hook for getting session data only
export function useSessionData() {
  const { data, status, signOut } = useSession();
  return { data, status, signOut };
}
