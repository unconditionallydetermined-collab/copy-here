import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import logger from './services/logger'
import { initKeepAlive } from './services/api'

import LandingPage   from './pages/LandingPage'
import AboutPage     from './pages/AboutPage'
import DownloadsPage from './pages/DownloadsPage'
import AuthPage      from './pages/AuthPage'
import Dashboard     from './pages/Dashboard'
import ProfilePage   from './pages/ProfilePage'
import ResumePage    from './pages/ResumePage'
import SkillsPage    from './pages/SkillsPage'
import GitHubPage    from './pages/GitHubPage'
import LeetCodePage  from './pages/LeetCodePage'
import LinkedInPage  from './pages/LinkedInPage'
import ProjectsPage  from './pages/ProjectsPage'
import CertificatesPage from './pages/CertificatesPage'
import JobsPage      from './pages/JobsPage'
import GoalsPage     from './pages/GoalsPage'
import AIAssistant   from './pages/AIAssistant'
import PortfolioPage from './pages/PortfolioPage'
import DebugPage     from './pages/DebugPage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://career-sync-backend-71c1.onrender.com'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading Career Sync...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function RouteTelemetryTracker() {
  const location = useLocation()

  useEffect(() => {
    logger.info('Navigation', `Route changed to ${location.pathname}${location.search}`, {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    })
  }, [location])

  return null
}

function AppRoutes() {
  return (
    <>
      <RouteTelemetryTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/download" element={<DownloadsPage />} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="/resume"       element={<ResumePage />} />
          <Route path="/skills"       element={<SkillsPage />} />
          <Route path="/github"       element={<GitHubPage />} />
          <Route path="/leetcode"     element={<LeetCodePage />} />
          <Route path="/linkedin"     element={<LinkedInPage />} />
          <Route path="/projects"     element={<ProjectsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/jobs"         element={<JobsPage />} />
          <Route path="/goals"        element={<GoalsPage />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/portfolio"    element={<PortfolioPage />} />
          <Route path="/debug"        element={<DebugPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  useEffect(() => {
    initKeepAlive()
  }, [])
  // Pre-warm / ping Render backend on app open so user avoids cold-start latency
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/health`, { method: 'GET', mode: 'no-cors' })
      } catch {
        // Silent catch: pre-warm only
      }
    }
    pingBackend()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="system"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
              }
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
