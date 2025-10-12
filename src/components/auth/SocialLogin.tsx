// Universal Social Login Component for KidsViewer
// Supports Google/GitHub OIDC login with configurable providers

import React, { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

// Custom Google G Icon Component
const GoogleIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
}

export interface SocialLoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: string;
  };
  error?: string;
}

export interface SocialLoginProps {
  providers: SocialProvider[];
  onLoginSuccess: (result: SocialLoginResult) => void;
  onLoginError: (error: string) => void;
  className?: string;
  showTitle?: boolean;
  title?: string;
  compact?: boolean; // New prop for compact mode
}

export const SocialLogin: React.FC<SocialLoginProps> = ({
  providers,
  onLoginSuccess,
  onLoginError,
  className = '',
  showTitle = true,
  title = 'Or continue with social login',
  compact = false,
}) => {
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialLogin = async (providerId: string) => {
    setLoading(providerId);
    try {
      // Call the appropriate OIDC login function
      const result = await performOIDCLogin(providerId);

      if (result.success) {
        onLoginSuccess(result);
      } else {
        onLoginError(result.error || 'Login failed');
      }
    } catch (error: any) {
      onLoginError(error.message || 'Login failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{title}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {providers.map(provider => {
          const Icon = provider.icon;
          const isLoading = loading === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => handleSocialLogin(provider.id)}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 transform ${
                isDark
                  ? 'bg-gray-800 border border-gray-700 text-white hover:bg-gray-700'
                  : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
              } ${provider.hoverColor} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className={`${compact ? 'w-5 h-5' : 'w-5 h-5 mr-3'} animate-spin`} />
                ) : (
                  <Icon className={`${compact ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} />
                )}
                {!compact && <span>{isLoading ? 'Connecting...' : `Continue with ${provider.name}`}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Redirecting to {loading}...</p>
        </div>
      )}
    </div>
  );
};

// OIDC Login Implementation
async function performOIDCLogin(providerId: string): Promise<SocialLoginResult> {
  switch (providerId) {
    case 'google':
      return await loginWithGoogleOIDC();
    case 'github':
      return await loginWithGitHubOIDC();
    default:
      return {
        success: false,
        error: `Unsupported provider: ${providerId}`,
      };
  }
}

// Google OIDC Login
async function loginWithGoogleOIDC(): Promise<SocialLoginResult> {
  try {
    // Google OIDC configuration
    const googleConfig = {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'openid email profile',
      responseType: 'code',
    };

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: googleConfig.clientId,
      redirect_uri: googleConfig.redirectUri,
      scope: googleConfig.scope,
      response_type: googleConfig.responseType,
      access_type: 'offline',
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Open popup window for OAuth
    const popup = window.open(authUrl, 'google-login', 'width=500,height=600,scrollbars=yes,resizable=yes');

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Wait for popup to complete
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // In a real implementation, you would handle the callback
          // For now, return a mock success
          resolve({
            success: true,
            user: {
              id: 'mock-google-user-id',
              email: 'user@gmail.com',
              name: 'Google User',
              provider: 'google',
            },
          });
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error('Login timeout'));
      }, 300000);
    });
  } catch (error: any) {
    console.error('Google OIDC login failed:', error);
    return {
      success: false,
      error: error.message || 'Google login failed',
    };
  }
}

// GitHub OIDC Login
async function loginWithGitHubOIDC(): Promise<SocialLoginResult> {
  try {
    // GitHub OIDC configuration
    const githubConfig = {
      clientId: process.env.VITE_GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'user:email',
    };

    // Build GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: githubConfig.clientId,
      redirect_uri: githubConfig.redirectUri,
      scope: githubConfig.scope,
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // Open popup window for OAuth
    const popup = window.open(authUrl, 'github-login', 'width=500,height=600,scrollbars=yes,resizable=yes');

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Wait for popup to complete
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // In a real implementation, you would handle the callback
          // For now, return a mock success
          resolve({
            success: true,
            user: {
              id: 'mock-github-user-id',
              email: 'user@github.com',
              name: 'GitHub User',
              provider: 'github',
            },
          });
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error('Login timeout'));
      }, 300000);
    });
  } catch (error: any) {
    console.error('GitHub OIDC login failed:', error);
    return {
      success: false,
      error: error.message || 'GitHub login failed',
    };
  }
}

// Predefined provider configurations
export const SOCIAL_PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
    color: 'from-red-500 to-red-600',
    hoverColor: 'hover:from-red-600 hover:to-red-700',
  } as SocialProvider,

  github: {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'from-gray-800 to-gray-900',
    hoverColor: 'hover:from-gray-900 hover:to-black',
  } as SocialProvider,
};

// Helper function to create provider arrays
export const createProviderArray = (...providerIds: (keyof typeof SOCIAL_PROVIDERS)[]): SocialProvider[] => {
  return providerIds.map(id => SOCIAL_PROVIDERS[id]);
};
