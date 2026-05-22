import { useEffect, useState } from 'react'
import { ErrorState, LoadingState } from './components/DataState'
import PageTitle from './components/PageTitle'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { isValidPage } from './config/navigation'
import { useDashboardData } from './hooks/useDashboardData'
import AcceptInvitePage from './pages/auth/AcceptInvitePage'
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

function getHashState() {
  const rawHash = window.location.hash.replace('#', '')
  const [route = '', query = ''] = rawHash.split('?')
  return {
    route,
    params: new URLSearchParams(query),
  }
}

export default function App() {
  const [hashState, setHashState] = useState(getHashState)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [verificationState, setVerificationState] = useState(getPendingVerificationState)
  const route = hashState.route
  const isInvitationRoute = route === 'accept-invite'
  const invitationToken = hashState.params.get('token') || ''
  const openCreateUser = hashState.params.get('modal') === 'add'
  const openCreateIntegration = hashState.params.get('modal') === 'add'
  const isManager = user?.role?.trim().toLowerCase() === 'manager'
  const managerOnlyPages = new Set(['users', 'integrations'])
  const page = isValidPage(route) && (!managerOnlyPages.has(route) || isManager) ? route : 'insights'
  const ActivePage = pageRegistry[page] || pageRegistry.insights
  const isStandalonePage = page === 'users' || page === 'inventory' || page === 'integrations'
  const shouldLoadDashboard = Boolean(user) && !isStandalonePage
  const { data, error, loading } = useDashboardData({ enabled: shouldLoadDashboard })

  useEffect(() => {
    const onHashChange = () => setHashState(getHashState())
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
    setHashState(getHashState())
  }

  const handleAuthenticated = (nextUser) => {
    setUser(nextUser)
    setPendingVerificationState(null)
    setVerificationState({ email: '', message: '' })
    window.location.hash = 'insights'
    setHashState(getHashState())
  }

  const handleVerificationRequired = (pendingState) => {
    setPendingVerificationState(pendingState)
    setVerificationState({
      email: pendingState?.email || '',
      message: pendingState?.message || '',
    })
    window.location.hash = 'verify-email'
    setHashState(getHashState())
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setVerificationState({ email: '', message: '' })
    window.location.hash = 'login'
    setHashState(getHashState())
  }

  const handleGoToLogin = () => {
    logoutUser()
    setUser(null)
    window.location.hash = 'login'
    setHashState(getHashState())
  }

  const AuthPage =
    route === 'accept-invite'
      ? AcceptInvitePage
      : route === 'signup'
      ? SignupPage
      : route === 'verify-email'
        ? VerifyEmailPage
        : route === 'forgot-password'
          ? ForgotPasswordPage
          : LoginPage

  if (authLoading) {
    if (isInvitationRoute) {
      return (
        <AcceptInvitePage
          token={invitationToken}
          onGoToLogin={handleGoToLogin}
        />
      )
    }

    return (
      <div className="auth-loading">
        <LoadingState />
      </div>
    )
  }

  if (isInvitationRoute) {
    return (
      <AcceptInvitePage
        token={invitationToken}
        onGoToLogin={handleGoToLogin}
      />
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
        onGoToLogin={handleGoToLogin}
        token={invitationToken}
      />
    )
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} user={user} onLogout={handleLogout} />

      <main className="min-w-0">
        <Topbar page={page} user={user} />

        <div className="content">
          <PageTitle page={page} />
          {page === 'users' ? <ActivePage currentUser={user} openCreateUser={openCreateUser} /> : null}
          {page === 'inventory' ? <ActivePage currentUser={user} /> : null}
          {page === 'integrations' ? <ActivePage currentUser={user} openCreateIntegration={openCreateIntegration} /> : null}
          {!isStandalonePage && loading ? <LoadingState /> : null}
          {!isStandalonePage && !loading && error ? <ErrorState error={error} /> : null}
          {!isStandalonePage && !loading && !error && data ? <ActivePage data={data} currentUser={user} /> : null}
        </div>
      </main>
    </div>
  )
}
