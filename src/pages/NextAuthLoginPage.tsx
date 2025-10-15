'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, useSessionData } from '../components/providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { Github, Mail, Lock, User, Zap, Eye, EyeOff, Wallet, Sparkles, Shield, Star } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { nextAuthAPI } from '../lib/nextauth-api';
import { JSEncrypt } from 'jsencrypt';
import { useWeb3Auth } from '../services/web3AuthService';
import { useAccount, useSignMessage } from 'wagmi';
import CryptoJS from 'crypto-js';

// Custom Google G Icon Component
const GoogleIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const DEMO_CREDENTIALS = {
  email: 'lyra@kidsviewer.app',
  password: '123456',
} as const;

export const NextAuthLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [name, setName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publicKeyFetched, setPublicKeyFetched] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { signIn } = useSession();
  const { data: session, status } = useSessionData();
  const { isDark } = useThemeStore();
  const t = useTranslation();
  const { openAuthModal } = useWeb3Auth();

  // Get wagmi state for monitoring connection
  const { address: wagmiAddress, isConnected: wagmiIsConnected, chain, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    console.log('🚀 NextAuthLoginPage mounted');
    console.log('🚀 Initial wagmi state:', { wagmiIsConnected, wagmiAddress, wagmiChainId });

    // Fetch public key for password encryption (only once)
    if (!publicKeyFetched) {
      setPublicKeyFetched(true);
      nextAuthAPI
        .getPublicKey()
        .then(key => {
          if (key) {
            console.debug('Public key preview:', key.substring(0, 50) + ' of size:', key.length);
          }
          setPublicKey(key || '');
        })
        .catch(err => console.error('Failed to fetch public key:', err));
    }

    // Check for invitation code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const invitationCodeParam = urlParams.get('invitation');
    if (invitationCodeParam) {
      setInvitationCode(invitationCodeParam);
      setShowRegister(true);
    }
  }, [publicKeyFetched]);

  // Listen for wagmi connection and handle wallet login
  useEffect(() => {
    console.log('🔄 Wagmi state changed:', {
      wagmiIsConnected,
      wagmiAddress,
      wagmiChainId,
      isWalletConnecting,
    });

    if (wagmiIsConnected && wagmiAddress && isWalletConnecting) {
      console.log('✅ Wallet connected successfully via wagmi');
      setSuccessMessage(`Wallet connected successfully! Address: ${wagmiAddress.slice(0, 6)}...${wagmiAddress.slice(-4)}`);
      setIsLoading(false);
      setIsWalletConnecting(false);

      // Clear timeout since connection was successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Automatically perform wallet login authentication
      handleWalletLogin();
    }
  }, [wagmiIsConnected, wagmiAddress, wagmiChainId, isWalletConnecting]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Redirect if already authenticated
  if (status === 'authenticated' && session) {
    const redirectPath = '/parental-page'; // Default to parent view
    return <Navigate to={redirectPath} replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Encrypt password with public key if available
      let encryptedPassword = '';
      if (publicKey) {
        try {
          // First hash the password with SHA512
          const hashedPassword = CryptoJS.SHA512(password).toString();
          console.log('SHA512 hashed password:', hashedPassword);

          // Use JSEncrypt for password encryption
          const encrypt = new JSEncrypt();
          encrypt.setPublicKey(publicKey);
          const encrypted = encrypt.encrypt(hashedPassword);

          if (encrypted) {
            encryptedPassword = encrypted;
            console.log('JSEncrypt encryption successful, length:', encryptedPassword.length);
          } else {
            throw new Error('JSEncrypt returned null');
          }
        } catch (encryptError: any) {
          console.error('Password encryption failed:', encryptError);
          setError('Password encryption failed: ' + encryptError.message);
          return;
        }
      } else {
        console.log('No public key available, using plain password');
      }

      console.log('Login attempt with:', {
        email,
        hasPassword: !!password,
        hasEncryptedPassword: !!encryptedPassword,
        publicKeyAvailable: !!publicKey,
      });

      const result = await signIn('credentials', {
        email,
        password: publicKey ? undefined : password,
        encryptedPassword: encryptedPassword,
      });

      if (!result.ok) {
        setError(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('github', { callbackUrl: '/' });
      if (!result.ok) {
        setError(result.error || 'GitHub login failed');
      }
    } catch (error: any) {
      setError(error.message || 'GitHub login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('google', { callbackUrl: '/' });
      if (!result.ok) {
        setError(result.error || 'Google login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    // Use wagmi state directly
    if (!wagmiIsConnected || !wagmiAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a message to sign - format should match backend expectations
      const timestamp = new Date().toISOString();
      const message = `KidsViewer Authentication\n\nTimestamp: ${timestamp}\nAddress: ${wagmiAddress}`;

      // Request signature from wallet using wagmi
      const signature = await signMessageAsync({ message });

      if (!signature) {
        throw new Error('Failed to get signature from wallet');
      }

      const chainName = chain?.name || '';
      const chainId = wagmiChainId || 1;

      console.log('Wallet login data:', {
        address: wagmiAddress,
        signature,
        message,
        chain: chainName,
        chainId,
      });

      // Call wallet login API which will create NextAuth session
      const result = await nextAuthAPI.walletLogin({
        address: wagmiAddress,
        signature: signature,
        message: message,
        chainName: chainName,
        chainId: chainId,
      });

      if (result.ok) {
        setSuccessMessage('Wallet login successful!');
        // Refresh session state instead of reloading page
        const sessionData = await nextAuthAPI.getSession();
        if (sessionData && sessionData.user && sessionData.user.id) {
          // Update AuthProvider state
          window.dispatchEvent(new CustomEvent('auth-session-update', { 
            detail: { session: sessionData, status: 'authenticated' } 
          }));
        }
      } else {
        setError(result.error || 'Wallet login failed');
      }
    } catch (error: any) {
      console.error('Wallet login error:', error);

      // Handle user rejection gracefully
      if (error.message?.includes('User rejected') || error.code === 4001) {
        setError('User cancelled wallet authentication');
      } else {
        setError(error.message || 'Wallet login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsLoading(true);
    setIsWalletConnecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('🔗 Opening wallet connection modal...');
      await openAuthModal();

      // Set a timeout to reset state if no connection happens
      timeoutRef.current = setTimeout(() => {
        console.log('Wallet connection timeout, resetting state');
        setIsLoading(false);
        setIsWalletConnecting(false);
        timeoutRef.current = null;
      }, 10000); // 10 second timeout

      // The actual connection state will be handled by the useEffect above
      // which listens to wagmi state changes
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setIsLoading(false);
      setIsWalletConnecting(false);

      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Handle user rejection gracefully
      if (error.message?.includes('User rejected') || error.code === 4001) {
        setError('User cancelled wallet connection');
      } else if (error.message?.includes('No wallet found')) {
        setError('No wallet found, please install wallet extension');
      } else {
        setError(error.message || 'Wallet connection failed, please try again');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await nextAuthAPI.register({
        email,
        password,
        name,
        invitationCode,
        turnstileToken: 'mock-turnstile-token', // Mock for now
      });

      if (result.ok) {
        setSuccessMessage('Registration successful! You can now login.');
        // Clear form and switch to login
        setEmail('');
        setPassword('');
        setName('');
        setInvitationCode('');
        setShowRegister(false);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Background Effects */}
      <div className="auth-background">
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="floating-elements">
          <div className="tech-element element-1">
            <Sparkles className="tech-icon" />
          </div>
          <div className="tech-element element-2">
            <Shield className="tech-icon" />
          </div>
          <div className="tech-element element-3">
            <Star className="tech-icon" />
          </div>
          <div className="tech-element element-4">
            <Zap className="tech-icon" />
          </div>
        </div>

        <div className="gradient-orbs">
          <div className={`orb orb-1 ${isDark ? 'dark' : 'light'}`}></div>
          <div className={`orb orb-2 ${isDark ? 'dark' : 'light'}`}></div>
          <div className={`orb orb-3 ${isDark ? 'dark' : 'light'}`}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="auth-content">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo-container">
              <div className="logo-glow"></div>
              <div className="logo-icon">
                <div className="rocket-emoji">🚀</div>
                <div className="logo-particles">
                  <div className="particle-1"></div>
                  <div className="particle-2"></div>
                  <div className="particle-3"></div>
                </div>
              </div>
            </div>

            <h1 className="app-title">
              <span className="title-gradient">KidsViewer</span>
            </h1>
            <p className="app-subtitle">{showRegister ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}</p>

            <div className="feature-tags">
              <span className="tag">🎓 教育科技</span>
              <span className="tag">🔒 安全防护</span>
              <span className="tag">⚡ 智能学习</span>
            </div>
          </div>

          {/* Form */}
          <div className="form-content">
            {!showRegister ? (
              <>
                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="email" className="input-label">
                      <Mail className="label-icon" />
                      {t('auth.email')}
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="auth-input"
                        required
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="password" className="input-label">
                      <Lock className="label-icon" />
                      {t('auth.password')}
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="auth-input"
                        autoComplete="current-password"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                        {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                      </button>
                      <div className="input-border"></div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="error-message">
                      <div className="error-icon">⚠️</div>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div className="success-message">
                      <div className="success-icon">✅</div>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Login Button */}
                  <button type="submit" disabled={isLoading || !publicKey} className={`login-button ${isLoading ? 'loading' : ''}`}>
                    <div className="button-glow"></div>
                    <div className="button-content">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner"></div>
                          {t('auth.loggingIn')}
                        </>
                      ) : (
                        <>
                          <Zap className="button-icon" />
                          {t('auth.login')}
                        </>
                      )}
                    </div>
                    <div className="button-border"></div>
                  </button>
                </form>

                {/* Social Login */}
                <div className="social-login-section">
                  <div className="social-login-title">
                    <span>{t('auth.continueWith')}</span>
                  </div>
                  <div className="social-login-buttons">
                    <button onClick={handleGoogleLogin} disabled={isLoading} className="social-login-compact">
                      <GoogleIcon className="w-5 h-5" />
                    </button>

                    <button onClick={handleGitHubLogin} disabled={isLoading} className="social-login-compact">
                      <Github className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleWalletConnect}
                      disabled={isLoading}
                      className={`wallet-login-button ${isLoading ? 'loading' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="wallet-icon" />
                          <span>Wallet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Register Link */}
                <div className="register-link">
                  <p>
                    {t('auth.noAccount')}{' '}
                    <button type="button" onClick={() => setShowRegister(true)} className="link-button">
                      {t('auth.registerNow')}
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Register Form */}
                <div className="register-header">
                  <h3 className="register-title">{t('auth.register')}</h3>
                  <p className="register-subtitle">{t('auth.registerSubtitle')}</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="reg-name" className="input-label">
                      <User className="label-icon" />
                      {t('auth.name')} <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth.namePlaceholder')}
                        className="auth-input"
                        required
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-email" className="input-label">
                      <Mail className="label-icon" />
                      {t('auth.email')} <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('auth.emailPlaceholder')}
                        className="auth-input"
                        required
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-password" className="input-label">
                      <Lock className="label-icon" />
                      {t('auth.password')} <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="reg-password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="auth-input"
                        autoComplete="new-password"
                        required
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="invitation-code" className="input-label">
                      <Shield className="label-icon" />
                      {t('auth.invitationCode')} <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <div className="input-glow"></div>
                      <input
                        id="invitation-code"
                        name="invitationCode"
                        type="text"
                        value={invitationCode}
                        onChange={e => setInvitationCode(e.target.value)}
                        placeholder={t('auth.invitationCodePlaceholder')}
                        className="auth-input"
                        required
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="error-message">
                      <div className="error-icon">⚠️</div>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div className="success-message">
                      <div className="success-icon">✅</div>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <button type="submit" disabled={isLoading} className={`login-button ${isLoading ? 'loading' : ''}`}>
                    <div className="button-glow"></div>
                    <div className="button-content">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner"></div>
                          {t('auth.registering')}
                        </>
                      ) : (
                        <>
                          <User className="button-icon" />
                          {t('auth.register')}
                        </>
                      )}
                    </div>
                    <div className="button-border"></div>
                  </button>
                </form>

                {/* Login Link */}
                <div className="register-link">
                  <p>
                    {t('auth.haveAccount')}{' '}
                    <button type="button" onClick={() => setShowRegister(false)} className="link-button">
                      {t('auth.loginHere')}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .auth-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: ${
            isDark
              ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)'
              : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 25%, #faf5ff 50%, #fdf2f8 75%, #fef7ed 100%)'
          };
          padding: 1rem;
          transition: background 0.3s ease;
        }

        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .particles-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899);
          border-radius: 50%;
          animation: particleFloat linear infinite;
          opacity: 0.6;
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .tech-element {
          position: absolute;
          width: 60px;
          height: 60px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .tech-icon {
          width: 24px;
          height: 24px;
          color: #00d4ff;
          opacity: 0.7;
        }

        .element-1 {
          top: 15%;
          left: 10%;
          animation: techFloat 6s ease-in-out infinite;
        }

        .element-2 {
          top: 25%;
          right: 15%;
          animation: techFloat 8s ease-in-out infinite reverse;
        }

        .element-3 {
          bottom: 20%;
          left: 20%;
          animation: techFloat 7s ease-in-out infinite;
        }

        .element-4 {
          bottom: 30%;
          right: 10%;
          animation: techFloat 5s ease-in-out infinite reverse;
        }

        .gradient-orbs {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.3;
          animation: orbFloat 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 200px;
          height: 200px;
          background: linear-gradient(45deg, #ec4899, #f59e0b);
          top: 60%;
          right: 20%;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(45deg, #10b981, #3b82f6);
          bottom: 20%;
          left: 50%;
          animation-delay: 14s;
        }

        .auth-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
        }

        .auth-card {
          background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          box-shadow: ${
            isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          };
          overflow: hidden;
          position: relative;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${
            isDark
              ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(91, 33, 182, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
          };
          opacity: 0.5;
          pointer-events: none;
        }

        .auth-header {
          text-align: center;
          padding: 2rem 2rem 1rem;
          position: relative;
          z-index: 2;
        }

        .logo-container {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
        }

        .logo-glow {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899);
          border-radius: 50%;
          opacity: 0.3;
          filter: blur(20px);
          animation: logoGlow 3s ease-in-out infinite;
        }

        .logo-icon {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
          animation: rocketBounce 2s ease-in-out infinite;
        }

        .rocket-emoji {
          font-size: 2rem;
          animation: rocketBounce 2s ease-in-out infinite;
        }

        .logo-particles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .logo-particles > div {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #00d4ff, #ec4899);
          border-radius: 50%;
          animation: logoParticle 3s ease-in-out infinite;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          animation-delay: 0s;
        }

        .particle-2 {
          top: 20%;
          right: 20%;
          animation-delay: 1s;
        }

        .particle-3 {
          bottom: 20%;
          left: 50%;
          animation-delay: 2s;
        }

        .app-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: titleGradient 3s ease-in-out infinite;
        }

        .app-subtitle {
          color: ${isDark ? '#94a3b8' : '#64748b'};
          font-size: 1rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .feature-tags {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          background: ${isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
          color: ${isDark ? '#00d4ff' : '#3b82f6'};
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid ${isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
        }

        .form-content {
          padding: 1rem 2rem 2rem;
          position: relative;
          z-index: 2;
        }

        .login-tabs {
          margin-bottom: 1.5rem;
        }

        .tab-buttons {
          display: flex;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 12px;
          padding: 0.25rem;
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          color: ${isDark ? '#94a3b8' : '#64748b'};
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          color: white;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }

        .register-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .register-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${isDark ? '#e2e8f0' : '#374151'};
          margin-bottom: 0.5rem;
        }

        .register-subtitle {
          color: ${isDark ? '#94a3b8' : '#64748b'};
          font-size: 0.875rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          position: relative;
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${isDark ? '#e2e8f0' : '#374151'};
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .label-icon {
          width: 1rem;
          height: 1rem;
          color: #00d4ff;
        }

        .required {
          color: #ef4444;
        }

        .input-wrapper {
          position: relative;
        }

        .input-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .input-wrapper:focus-within .input-glow {
          opacity: 0.5;
        }

        .auth-input {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: 0.875rem 1rem;
          background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 10px;
          color: ${isDark ? '#e2e8f0' : '#374151'};
          font-size: 0.875rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .auth-input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
        }

        .auth-input::placeholder {
          color: ${isDark ? '#64748b' : '#9ca3af'};
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: ${isDark ? '#64748b' : '#9ca3af'};
          cursor: pointer;
          z-index: 3;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #00d4ff;
        }

        .toggle-icon {
          width: 1rem;
          height: 1rem;
        }

        .input-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 1px solid transparent;
          border-radius: 10px;
          pointer-events: none;
          z-index: 1;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #22c55e;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .error-icon, .success-icon {
          font-size: 1rem;
        }

        .login-button {
          position: relative;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .login-button.loading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .button-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .login-button:hover .button-glow {
          opacity: 0.5;
        }

        .button-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .button-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .loading-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .button-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 1px solid transparent;
          border-radius: 12px;
          pointer-events: none;
        }

        .social-login-section {
          margin: 1.5rem 0;
        }

        .social-login-title {
          text-align: center;
          color: ${isDark ? '#94a3b8' : '#64748b'};
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .social-login-buttons {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .social-login-compact {
          width: 3rem;
          height: 3rem;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .social-login-compact:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-color: #00d4ff;
        }

        .wallet-login-button {
          width: 3rem;
          height: 3rem;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          background: ${isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          font-size: 0.625rem;
          font-weight: 600;
          color: ${isDark ? '#e2e8f0' : '#374151'};
        }

        .wallet-login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-color: #00d4ff;
        }

        .wallet-login-button.loading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .wallet-login-button.loading:hover {
          transform: none;
          box-shadow: none;
        }

        .loading-spinner-small {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        .wallet-icon {
          width: 1rem;
          height: 1rem;
          margin-bottom: 0.125rem;
        }


        .register-link {
          text-align: center;
          margin-top: 1rem;
        }

        .register-link p {
          color: ${isDark ? '#94a3b8' : '#64748b'};
          font-size: 0.875rem;
        }

        .link-button {
          background: none;
          border: none;
          color: #00d4ff;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s ease;
        }

        .link-button:hover {
          color: #5b21b6;
        }

        /* Animations */
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }

        @keyframes techFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes logoGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes rocketBounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(5deg); }
        }

        @keyframes logoParticle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }

        @keyframes titleGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .auth-content {
            max-width: 100%;
            padding: 0 0.5rem;
          }
          
          .form-content {
            padding: 1rem;
          }
          
          .app-title {
            font-size: 1.875rem;
          }
          
          .feature-tags {
            gap: 0.375rem;
          }
          
          .tag {
            font-size: 0.625rem;
            padding: 0.25rem 0.5rem;
          }

          .logo-container {
            width: 60px;
            height: 60px;
            margin: 0 auto 0.75rem;
          }

          .logo-icon {
            width: 60px;
            height: 60px;
          }

          .rocket-emoji {
            font-size: 1.5rem;
          }

          .auth-header {
            margin-bottom: 1rem;
          }

          .app-subtitle {
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
          }

          .social-login-buttons {
            gap: 0.375rem;
          }

          .social-login-compact,
          .wallet-login-button {
            width: 2.75rem;
            height: 2.75rem;
            padding: 0.625rem;
          }

          .login-button {
            padding: 0.75rem 1.25rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};
