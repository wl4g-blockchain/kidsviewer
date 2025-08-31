import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ParentalDashboard } from './pages/ParentalDashboard'
import { PersonViewer } from './pages/PersonViewer'
import { SettingsPage } from './pages/SettingsPage'
import { AuthPage } from './pages/AuthPage'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated, userType } = useAuthStore()

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/parental" element={<ParentalDashboard />} />
        <Route path="/person" element={<PersonViewer />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}

export default App 