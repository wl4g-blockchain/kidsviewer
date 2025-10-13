import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * OAuth Callback Page for handling social login redirects
 * Supports both web popup and iOS in-app browser scenarios
 */
export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const t = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        console.log('OAuth callback received:', { code, error, state });

        if (error) {
          // Handle OAuth error
          setStatus('error');
          setMessage(`OAuth error: ${error}`);
          console.error('OAuth error:', error);
          return;
        }

        if (!code) {
          // No authorization code received
          setStatus('error');
          setMessage('No authorization code received');
          console.error('No authorization code received');
          return;
        }

        // Check if running in iOS native environment
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
          // Close the in-app browser
          await Browser.close();
        }

        // In a real implementation, you would:
        // 1. Exchange the authorization code for an access token
        // 2. Get user information from the OAuth provider
        // 3. Create or update user account
        // 4. Generate JWT token for the app
        // 5. Redirect to appropriate page

        // For now, simulate successful authentication
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Simulate API call delay
        setTimeout(() => {
          // Redirect to auth page with success message
          navigate('/auth?success=true');
        }, 2000);

      } catch (error) {
        console.error('Callback handling failed:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Processing Authentication...'}
          {status === 'success' && 'Authentication Successful!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Please wait while we process your authentication.'}
        </p>

        {status === 'loading' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500">This may take a few moments...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <button
              onClick={() => navigate('/auth')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="text-sm text-gray-500">Redirecting to the app...</p>
          </div>
        )}
      </div>
    </div>
  );
};
