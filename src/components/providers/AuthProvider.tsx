'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { nextAuthAPI } from '../../lib/nextauth-api';

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
        } else {
          console.log('No valid session found, setting unauthenticated');
          setSession(null);
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setSession(null);
        setStatus('unauthenticated');
      }
    };

    checkSession();
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
