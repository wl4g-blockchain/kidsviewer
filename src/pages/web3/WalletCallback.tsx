// Wallet callback page for handling wallet app redirects
// This page handles the return from wallet apps after authentication

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nProvider';
import { WalletLauncher } from '../../utils/web3/walletLauncher';

export const WalletCallback: React.FC = () => {
  const t = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get callback parameters
        const walletId = searchParams.get('walletId');
        const address = searchParams.get('address');
        // const signature = searchParams.get('signature');
        const error = searchParams.get('error');
        const action = searchParams.get('action');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (action === 'sign' && walletId && address) {
          // Handle SIWE authentication callback
          const result = await WalletLauncher.handleWalletCallback(window.location.href);

          if (result.success) {
            setStatus('success');
            setMessage('Wallet connected successfully!');

            // Store connection info and redirect
            localStorage.setItem(
              'walletConnection',
              JSON.stringify({
                walletId: result.walletId,
                address: result.address,
                signature: result.signature,
                timestamp: Date.now(),
              })
            );

            // Redirect back to the app after a short delay
            setTimeout(() => {
              navigate('/settings');
            }, 2000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Authentication failed');
          }
        } else {
          setStatus('error');
          setMessage('Invalid callback parameters');
        }
      } catch (error) {
        console.error('Wallet callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('web3.walletLauncher.processing')}</h2>
            <p className="text-gray-600">Please wait while we process your wallet connection.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('web3.walletLauncher.success')}</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">{t('web3.walletLauncher.redirecting')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('web3.walletLauncher.error')}</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/settings')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('web3.walletLauncher.backToSettings')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
