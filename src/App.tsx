import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@components/Layout'
import { HomePage } from '@pages/HomePage'
import { ParentDashboard } from '@pages/ParentDashboard'
import { ChildViewer } from '@pages/ChildViewer'
import { SettingsPage } from '@pages/SettingsPage'
import { AuthPage } from '@pages/AuthPage'
import { useAuthStore } from '@stores/authStore'

function App() {
  const { isAuthenticated, userType } = useAuthStore()

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/child" element={<ChildViewer />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}

export default App 