import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AuthUtil } from '../utils/authUtil';
import { Eye, EyeOff, Mail, Lock, Sparkles, Star, Heart } from 'lucide-react';

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

  const { login, register, isLoading, error, clearError, isAuthenticated, viewMode } = useAuthStore();
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 25%, #faf5ff 50%, #fdf2f8 75%, #fef7ed 100%)',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top right controls */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <LanguageSwitcher />
        {/* Theme switcher placeholder - can be implemented later */}
        <button
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            border: '2px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#3b82f6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
          title="Switch theme"
        >
          🌙
        </button>
      </div>

      {/* Background decorative elements */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '5rem',
            left: '5rem',
            color: '#93c5fd',
            animation: 'bounce 2s infinite',
            opacity: 0.3,
          }}
        >
          <Sparkles style={{ width: '2rem', height: '2rem' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '8rem',
            right: '6rem',
            color: '#c4b5fd',
            animation: 'pulse 2s infinite',
            opacity: 0.4,
          }}
        >
          <Star style={{ width: '1.5rem', height: '1.5rem', fill: 'currentColor' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '8rem',
            left: '8rem',
            color: '#f9a8d4',
            animation: 'bounce 2s infinite',
            animationDelay: '2s',
            opacity: 0.35,
          }}
        >
          <Heart style={{ width: '1.75rem', height: '1.75rem', fill: 'currentColor' }} />
        </div>
      </div>

      <div
        style={{
          maxWidth: '28rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '5rem',
                height: '5rem',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
                borderRadius: '50%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                marginBottom: '1.5rem',
                animation: 'pulse 2s infinite',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🚀</span>
            </div>
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              background: 'linear-gradient(45deg, #2563eb, #7c3aed, #db2777)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem',
            }}
          >
            {t('common.appName')}
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              fontWeight: '500',
            }}
          >
            🎉 {t('auth.loginSuccess')}
          </p>
        </div>

        {/* Login Form */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            border: '1px solid #f3f4f6',
          }}
        >
          {/* Demo Credentials Info */}
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: '#92400e',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
              }}
            >
              🎯 演示账户凭据
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#b45309',
                margin: '0',
              }}
            >
              邮箱:{' '}
              <code style={{ backgroundColor: '#fde68a', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                {DEMO_CREDENTIALS.email}
              </code>{' '}
              | 密码:{' '}
              <code style={{ backgroundColor: '#fde68a', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', marginLeft: '0.25rem' }}>
                {DEMO_CREDENTIALS.password}
              </code>
            </p>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={handleSubmit}>
            {/* Email/Phone Input */}
            <div>
              <label
                htmlFor="emailOrPhone"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                📧 {t('auth.email')} / {t('auth.phone')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#3b82f6',
                    width: '1.25rem',
                    height: '1.25rem',
                  }}
                />
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="text"
                  required
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  style={{
                    paddingLeft: '2.5rem',
                    width: '100%',
                    padding: '0.75rem 3rem',
                    border: '2px solid #c4b5fd',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: 'rgba(245, 243, 255, 0.5)',
                    color: '#1f2937',
                    fontWeight: '500',
                  }}
                  placeholder={t('auth.email') + ' / ' + t('auth.phone')}
                  onFocus={e => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#bfdbfe';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                🔐 {t('auth.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8b5cf6',
                    width: '1.25rem',
                    height: '1.25rem',
                  }}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    width: '100%',
                    padding: '0.75rem 3rem',
                    border: '2px solid #c4b5fd',
                    borderRadius: '0.75rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: 'rgba(245, 243, 255, 0.5)',
                    color: '#1f2937',
                    fontWeight: '500',
                  }}
                  placeholder={t('auth.password')}
                  onFocus={e => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#c4b5fd';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#8b5cf6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} />
                  ) : (
                    <Eye style={{ width: '1.25rem', height: '1.25rem' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  backgroundColor: '#fef2f2',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #fecaca',
                }}
              >
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0.75rem 3rem',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1.125rem',
                fontWeight: '700',
                color: 'white',
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '0.75rem',
                    }}
                  ></div>
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                <span>🚀 {t('auth.login')}</span>
              )}
            </button>
          </form>

          {/* Auto-register hint */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>💡 {t('auth.registerSuccess')}</p>
          </div>
        </div>

        {/* Feature highlight */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(45deg, #ecfdf5, #f0fdfa)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              border: '1px solid #a7f3d0',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎯✨📚</div>
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#065f46',
                marginBottom: '0.5rem',
              }}
            >
              Smart Parental Control
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#047857',
                lineHeight: '1.5',
              }}
            >
              Create personalized profiles for each child, set customized viewing time and learning questions. Switch to child mode with one
              click to make learning more fun!
            </p>
          </div>
        </div>
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0,-30px,0); }
          70% { transform: translate3d(0,-15px,0); }
          90% { transform: translate3d(0,-4px,0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
