import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/auth/AuthGuard';
import { AuthProvider } from './components/providers/AuthProvider';
import { ParentalHome } from './pages/ParentalHome';
import { PersonHome } from './pages/PersonHome';
import { SettingsPage } from './pages/SettingsPage';
import { NextAuthLoginPage } from './pages/NextAuthLoginPage';
import { useSessionData } from './components/providers/AuthProvider';
import { useState } from 'react';

// App content component that uses session
function AppContent() {
  const { status } = useSessionData();
  const [viewMode] = useState<'parent' | 'child'>('parent');
  const [activePerson] = useState<any>(null);

  // Show loading screen while checking authentication
  if (status === 'loading') {
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
              width: '4rem',
              height: '4rem',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem',
            }}
          ></div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            🚀 Starting KidsViewer...
          </h2>
          <p
            style={{
              color: '#6b7280',
              fontSize: '1rem',
            }}
          >
            Please wait...
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

  return (
    <Routes>
      {/* Auth page - no protection needed */}
      <Route path="/auth" element={<NextAuthLoginPage />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <AuthGuard>
            <Layout>
              <Routes>
                {/* Auto redirect to corresponding home page based on view mode */}
                <Route path="/" element={<Navigate to={viewMode === 'parent' ? '/parental-page' : '/person-page'} replace />} />

                {/* Parent-only routes */}
                {viewMode === 'parent' && (
                  <>
                    <Route path="/parental-page" element={<ParentalHome />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </>
                )}

                {/* Child-only routes */}
                {viewMode === 'child' && activePerson && (
                  <>
                    <Route path="/person-page" element={<PersonHome />} />
                  </>
                )}

                {/* Redirect invalid routes based on current mode */}
                <Route path="*" element={<Navigate to={viewMode === 'parent' ? '/parental-page' : '/person-page'} replace />} />
              </Routes>
            </Layout>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
