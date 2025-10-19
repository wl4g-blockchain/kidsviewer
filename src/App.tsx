import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ParentalHome } from '@/app/home/ParentalHome';
import { PersonHome } from '@/app/home/PersonHome';
import { SettingsPage } from '@/app/settings/SettingsPage';
import { SubAccountManagement } from '@/app/sub-accounts/SubAccountManagement';
import { UserProfilePage } from '@/app/user-profile/UserProfilePage';
import { NextAuthLoginPage } from '@/app/login/NextAuthLoginPage';
import { useSessionData } from '@/components/auth/AuthProvider';
import { useState, createContext, useContext, useEffect } from 'react';
import { Person } from '@/types';

// Context for managing view mode and active person
interface AppContextType {
  viewMode: 'parent' | 'child';
  setViewMode: (mode: 'parent' | 'child') => void;
  activePerson: Person | null;
  setActivePerson: (person: Person | null) => void;
  switchToPersonView: (person: Person) => void;
  switchToParentView: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// App content component that uses session
function AppContent() {
  const { data: session, status } = useSessionData();
  const [viewMode, setViewMode] = useState<'parent' | 'child'>('parent');
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  const switchToPersonView = (person: Person) => {
    setActivePerson(person);
    setViewMode('child');
  };

  const switchToParentView = () => {
    setActivePerson(null);
    setViewMode('parent');
  };

  // Set initial view mode based on user type when session is loaded
  useEffect(() => {
    if (session?.user?.userType) {
      const userType = parseInt(session.user.userType.toString());
      if (userType === 2) {
        // Sub account (child) - redirect to child view
        setViewMode('child');
        // Create a default Person object for child accounts
        const defaultPerson: Person = {
          id: parseInt(session.user.id),
          userId: parseInt(session.user.id),
          parentalId: 0, // Will be set by the backend
          alias: session.user.name || 'Child',
          name: session.user.name || 'Child',
          ageGroup: 'older', // Default age group
          settings: {
            perTimeLimitMinutes: 30,
            dailyTimeLimitMinutes: 120,
            questionCount: 5,
            questionsPerDay: 20,
            platformIds: [],
            subjects: []
          },
          statistics: {
            dailyUsage: [],
            questionStats: {
              totalAnswered: 0,
              totalCorrect: 0,
              accuracyRate: 0,
              subjectPreference: {},
              repeatedQuestions: []
            },
            learningProgress: {
              subjects: {},
              overallScore: 0,
              level: 'beginner'
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setActivePerson(defaultPerson);
      } else {
        // Parent account - use parent view
        setViewMode('parent');
        setActivePerson(null);
      }
    }
  }, [session]);

  const contextValue: AppContextType = {
    viewMode,
    setViewMode,
    activePerson,
    setActivePerson,
    switchToPersonView,
    switchToParentView,
  };

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
    <AppContext.Provider value={contextValue}>
      <Routes>
        {/* Auth page - no protection needed */}
        <Route path="/login" element={<NextAuthLoginPage />} />

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
                      <Route path="/sub-accounts" element={<SubAccountManagement />} />
                      <Route path="/profile" element={<UserProfilePage />} />
                    </>
                  )}

                  {/* Child-only routes */}
                  {viewMode === 'child' && (
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
    </AppContext.Provider>
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
