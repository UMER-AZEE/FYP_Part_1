import { useEffect, useState } from 'react'
import { ErrorState, LoadingState } from './components/DataState'
import PageTitle from './components/PageTitle'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { getInitialPage, isValidPage } from './config/navigation'
import { useDashboardData } from './hooks/useDashboardData'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import { pageRegistry } from './pages/pageRegistry'
import { getAuthToken } from './services/api/client'
import {
  fetchCurrentUser,
  logoutUser,
  getPendingVerificationState,
  setPendingVerificationState,
} from './services/auth/authService'

function getRoute() {
  return window.location.hash.replace('#', '')
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [verificationState, setVerificationState] = useState(getPendingVerificationState)
  const { data, error, loading } = useDashboardData()

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    let active = true

    async function loadSession() {
      if (!getAuthToken()) {
        if (active) {
          setAuthLoading(false)
        }
        return
      }

      try {
        const currentUser = await fetchCurrentUser()
        if (active) {
          setUser(currentUser)
        }
      } catch {
        logoutUser()
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      active = false
    }
  }, [])

  const navigate = (key) => {
    if (!isValidPage(key)) return
    window.location.hash = key
    setRoute(key)
  }

  const handleAuthenticated = (nextUser) => {
    setUser(nextUser)
    setPendingVerificationState(null)
    setVerificationState({ email: '', message: '' })
    window.location.hash = 'insights'
    setRoute('insights')
  }

  const handleVerificationRequired = (pendingState) => {
    setPendingVerificationState(pendingState)
    setVerificationState({
      email: pendingState?.email || '',
      message: pendingState?.message || '',
    })
    window.location.hash = 'verify-email'
    setRoute('verify-email')
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setVerificationState({ email: '', message: '' })
    window.location.hash = 'login'
    setRoute('login')
  }

  const page = isValidPage(route) ? route : getInitialPage()
  const ActivePage = pageRegistry[page] || pageRegistry.insights
  const AuthPage =
    route === 'signup'
      ? SignupPage
      : route === 'verify-email'
        ? VerifyEmailPage
        : route === 'forgot-password'
          ? ForgotPasswordPage
          : LoginPage

  if (authLoading) {
    return (
      <div className="auth-loading">
        <LoadingState />
      </div>
    )
  }

  if (!user) {
    return (
      <AuthPage
        email={verificationState.email}
        initialMessage={verificationState.message}
        onAuthenticated={handleAuthenticated}
        onVerificationRequired={handleVerificationRequired}
        onVerificationStateChanged={(nextState) => {
          const mergedState = {
            email: nextState?.email ?? verificationState.email,
            message: nextState?.message ?? verificationState.message,
          }
          setPendingVerificationState(mergedState)
          setVerificationState(mergedState)
        }}
        onGoToLogin={() => {
          window.location.hash = 'login'
          setRoute('login')
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} user={user} onLogout={handleLogout} />

      <main className="min-w-0">
        <Topbar page={page} />

        <div className="content">
          <PageTitle page={page} />
          {loading ? <LoadingState /> : null}
          {!loading && error ? <ErrorState error={error} /> : null}
          {!loading && !error && data ? <ActivePage data={data} /> : null}
        </div>
      </main>
    </div>
  )
}
