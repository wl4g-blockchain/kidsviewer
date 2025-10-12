import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from '../i18n/I18nProvider';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AuthUtil } from '../utils/authUtil';
import { Eye, EyeOff, Mail, Lock, Wallet, Sparkles, Zap, Shield, Star } from 'lucide-react';
import { SocialLogin, createProviderArray, SocialLoginResult } from '../components/auth/SocialLogin';
import { reownConnectAuthService } from '../services/web3AuthService';

// Demo credentials - in production these would come from environment or config
const DEMO_CREDENTIALS = {
  email: 'lyra@kidsviewer.local',
  password: '123456',
} as const;

export const AuthPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    emailOrPhone: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
  });

  const { login, register, web3Login, isLoading, error, clearError, isAuthenticated, viewMode } = useAuthStore();
  const { isDark } = useThemeStore();
  const t = useTranslation();

  // Redirect if already authenticated
  useEffect(() => {
    if (AuthUtil.isAuthenticated()) {
      // User is already logged in, they shouldn't be on the auth page
      console.log('User already authenticated, should redirect');
    }
  }, []);

  // If user is authenticated, redirect to appropriate page
  if (isAuthenticated) {
    const redirectPath = viewMode === 'parent' ? '/parental-page' : '/person-page';
    return <Navigate to={redirectPath} replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSocialLoginSuccess = (result: SocialLoginResult) => {
    console.log('Social login successful:', result);
    // Here you would typically handle the social login result
    // For now, we'll just show a success message
    if (result.user) {
      // You could call a social login API here
      console.log(`Welcome ${result.user.name} (${result.user.provider})`);
    }
  };

  const handleSocialLoginError = (error: string) => {
    console.error('Social login failed:', error);
    // You could show an error message here
  };

  const isEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.emailOrPhone || !formData.password) {
      return;
    }

    // Call API to authenticate user
    const loginSuccess = await login(formData.emailOrPhone, formData.password);

    // If login fails and it's an email, try auto-register
    if (!loginSuccess && isEmail(formData.emailOrPhone)) {
      // Auto-register with email
      await register(
        formData.emailOrPhone,
        '', // phone
        formData.password,
        formData.emailOrPhone.split('@')[0] // use email prefix as name
      );
    }
  };

  const handleConnectLogin = async () => {
    try {
      console.log('AuthPage: Opening wallet connection modal');
      const authState = await reownConnectAuthService.openAuthModal();
      if (authState) {
        await web3Login();
      }
    } catch (error) {
      console.error('Web3 login failed:', error);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Animated Background */}
      <div className="auth-background">
        {/* Web3 Tech Particles */}
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Tech Elements */}
        <div className="floating-elements">
          <div className="tech-element element-1">
            <Zap className="tech-icon" />
          </div>
          <div className="tech-element element-2">
            <Shield className="tech-icon" />
          </div>
          <div className="tech-element element-3">
            <Star className="tech-icon" />
          </div>
          <div className="tech-element element-4">
            <Sparkles className="tech-icon" />
          </div>
        </div>

        {/* Gradient Orbs */}
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
        </div>
      </div>

      {/* Top right controls */}
      <div className="auth-controls">
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main content */}
      <div className="auth-content">
        {/* App Logo and Title */}
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo-glow"></div>
            <div className="logo-icon">
              <span className="rocket-emoji">🚀</span>
            </div>
            <div className="logo-particles">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="logo-particle" />
              ))}
            </div>
          </div>

          <h1 className="app-title">
            <span className="title-text">{t('common.appName')}</span>
            <div className="title-glow"></div>
          </h1>

          <p className="app-subtitle">{t('auth.subtitle')}</p>

          <div className="feature-tags">
            <span className="tag tag-web3">{t('auth.featureWeb3')}</span>
            <span className="tag tag-education">{t('auth.featureEducation')}</span>
            <span className="tag tag-fun">{t('auth.featureFun')}</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="auth-form-container">
          <div className="form-glow"></div>
          <div className="form-content">
            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Email/Phone Input */}
              <div className="input-group">
                <label htmlFor="emailOrPhone" className="input-label">
                  <Mail className="label-icon" />
                  {t('auth.email')} / {t('auth.phone')}
                </label>
                <div className="input-wrapper">
                  <div className="input-glow"></div>
                  <input
                    id="emailOrPhone"
                    name="emailOrPhone"
                    type="text"
                    value={formData.emailOrPhone}
                    onChange={handleInputChange}
                    placeholder={t('auth.email')}
                    className="auth-input"
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              {/* Password Input */}
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
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t('auth.password')}
                    className="auth-input"
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

              {/* Login Buttons Row */}
              <div className="login-buttons-row">
                {/* Main Login Button */}
                <button type="submit" disabled={isLoading} className={`login-button ${isLoading ? 'loading' : ''}`}>
                  <div className="button-glow"></div>
                  <div className="button-content">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        {t('common.submitting')}
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

                {/* Social Login Buttons */}
                <div className="social-login-container">
                  <div className="social-login-title">
                    <span>{t('auth.continueWith')}</span>
                  </div>
                  <div className="social-login-buttons">
                    <SocialLogin
                      providers={createProviderArray('google', 'github')}
                      onLoginSuccess={handleSocialLoginSuccess}
                      onLoginError={handleSocialLoginError}
                      showTitle={false}
                      compact={true}
                      className="social-login-compact"
                    />
                    <button 
                      type="button"
                      onClick={handleConnectLogin} 
                      disabled={isLoading} 
                      className="wallet-login-button"
                    >
                      <Wallet className="wallet-icon" />
                      <span>Wallet</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
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
          background: rgba(255, 255, 255, 0.05);
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
        }

        .orb-1 {
          width: 200px;
          height: 200px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6);
          top: 10%;
          left: 5%;
          animation: orbFloat 10s ease-in-out infinite;
        }

        .orb-2 {
          width: 150px;
          height: 150px;
          background: linear-gradient(45deg, #ec4899, #f59e0b);
          top: 20%;
          right: 10%;
          animation: orbFloat 12s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 180px;
          height: 180px;
          background: linear-gradient(45deg, #10b981, #3b82f6);
          bottom: 15%;
          left: 15%;
          animation: orbFloat 8s ease-in-out infinite;
        }

        .orb-4 {
          width: 120px;
          height: 120px;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          bottom: 25%;
          right: 5%;
          animation: orbFloat 14s ease-in-out infinite reverse;
        }

        .auth-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .auth-content {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 1.5rem;
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
          filter: blur(20px);
          opacity: 0.6;
          animation: logoGlow 3s ease-in-out infinite;
        }

        .logo-icon {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #1a1a2e, #16213e);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
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

        .logo-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #00d4ff;
          border-radius: 50%;
          animation: logoParticle 4s linear infinite;
        }

        .logo-particle:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
        .logo-particle:nth-child(2) { top: 30%; right: 20%; animation-delay: 0.5s; }
        .logo-particle:nth-child(3) { bottom: 30%; left: 30%; animation-delay: 1s; }
        .logo-particle:nth-child(4) { bottom: 20%; right: 30%; animation-delay: 1.5s; }
        .logo-particle:nth-child(5) { top: 50%; left: 10%; animation-delay: 2s; }
        .logo-particle:nth-child(6) { top: 50%; right: 10%; animation-delay: 2.5s; }

        .app-title {
          position: relative;
          font-size: 2.25rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
        }

        .title-text {
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899, #f59e0b);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleGradient 3s ease-in-out infinite;
        }

        .title-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899);
          filter: blur(20px);
          opacity: 0.3;
          z-index: -1;
        }

        .app-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .feature-tags {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .tag {
          padding: 0.375rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .tag:hover {
          background: rgba(0, 212, 255, 0.2);
          border-color: rgba(0, 212, 255, 0.5);
          transform: translateY(-2px);
        }

        .auth-form-container {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .form-glow {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00d4ff, #5b21b6, #ec4899, #f59e0b);
          border-radius: 24px;
          opacity: 0.3;
          z-index: -1;
          animation: formGlow 4s ease-in-out infinite;
        }

        .form-content {
          padding: 1.5rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          position: relative;
        }

        .input-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.75rem;
        }

        .label-icon {
          width: 1rem;
          height: 1rem;
          color: #00d4ff;
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
        }

        .auth-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          outline: none;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .auth-input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .auth-input:focus + .input-glow {
          opacity: 0.3;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .toggle-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .input-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 1px solid transparent;
          border-radius: 12px;
          pointer-events: none;
          transition: border-color 0.3s ease;
        }

        .auth-input:focus + .password-toggle + .input-border {
          border-color: rgba(0, 212, 255, 0.5);
        }

        .login-buttons-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 1rem 0;
        }

        .social-login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .social-login-title {
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .social-login-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
        }

        .social-login-compact {
          margin: 0;
        }

        .social-login-compact .space-y-4 {
          margin: 0;
        }

        .social-login-compact .grid {
          display: flex;
          gap: 0.5rem;
        }

        .social-login-compact button {
          padding: 0.75rem;
          min-width: auto;
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
          position: relative;
          overflow: hidden;
        }

        .social-login-compact button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .social-login-compact button:active {
          transform: translateY(0);
        }

        .social-login-compact button span {
          display: none;
        }

        .wallet-login-button {
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 3rem;
          height: 3rem;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .wallet-login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .wallet-login-button:active {
          transform: translateY(0);
        }

        .wallet-login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .wallet-icon {
          width: 1rem;
          height: 1rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .error-icon {
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
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
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

        @keyframes formGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
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

          .login-buttons-row {
            gap: 0.75rem;
            margin: 0.75rem 0;
          }

          .social-login-container {
            gap: 0.5rem;
          }

          .social-login-buttons {
            gap: 0.375rem;
          }

          .social-login-compact button,
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
