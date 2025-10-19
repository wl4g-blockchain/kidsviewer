import { Layout } from './components/Layout';
import { AuthGuard } from './components/auth/AuthGuard';
import { AuthProvider } from './components/providers/AuthProvider';
import { ParentalHome } from './pages/ParentalHome';
import { PersonHome } from './pages/PersonHome';
import { SettingsPage } from './pages/SettingsPage';
import { SubAccountManagement } from './pages/SubAccountManagement';
import { UserProfilePage } from './pages/UserProfilePage';
import { NextAuthLoginPage } from './pages/NextAuthLoginPage';
import { useSessionData } from './components/providers/AuthProvider';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { useState, useEffect } from 'react';
import { Person } from './types';

// App content component that uses session
function AppContent() {
  const { data: session, status } = useSessionData();
  const { viewMode, setViewMode, activePerson, setActivePerson } = useAppContext();

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

  // For Next.js, we'll render the appropriate component based on view mode
  // This will be handled by Next.js routing instead of React Router
  return (
    <AuthGuard>
      <Layout>
        {viewMode === 'parent' ? <ParentalHome /> : <PersonHome />}
      </Layout>
    </AuthGuard>
  );
}

// Main App component with AuthProvider for Next.js
function AppNextJS() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default AppNextJS;
