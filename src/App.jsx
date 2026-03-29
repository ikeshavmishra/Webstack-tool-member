import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './Auth/LoginPage.jsx'
import SignupPage from './Auth/SignupPage.jsx'
import ForgotPasswordPage from './Auth/ForgotPasswordPage.jsx'
import ChangePasswordPage from './Auth/ChangePasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TransactionHistoryPage from './pages/TransactionHistoryPage.jsx'
import HelpDeskPage from './pages/HelpDeskPage.jsx'
import ResourceLaunchPage from './pages/ResourceLaunchPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import { useAuth } from './context/useAuth.js'

function RouteSkeleton() {
  return (
    <div className="app-canvas min-h-screen text-text-50">
      <div className="relative min-h-screen w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        <div className="relative z-30 mb-4 hidden lg:fixed lg:inset-y-5 lg:left-5 lg:mb-0 lg:block lg:w-[280px]">
          <aside className="glass-panel h-full overflow-hidden p-4">
            <div className="grid h-full gap-4">
              <div className="shimmer h-16 rounded-2xl" />
              <div className="grid gap-2">
                <div className="shimmer h-11 rounded-2xl" />
                <div className="shimmer h-11 rounded-2xl" />
                <div className="shimmer h-11 rounded-2xl" />
                <div className="shimmer h-11 rounded-2xl" />
                <div className="shimmer h-11 rounded-2xl" />
                <div className="shimmer h-11 rounded-2xl" />
              </div>
              <div className="mt-auto shimmer h-11 rounded-2xl" />
            </div>
          </aside>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4 lg:ml-[300px] lg:gap-5">
          <header className="glass-panel px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="shimmer h-11 w-11 rounded-full lg:hidden" />
              <div className="shimmer h-11 flex-1 rounded-full" />
              <div className="shimmer h-11 w-20 rounded-full sm:w-40" />
            </div>
          </header>

          <main className="min-h-0">
            <div className="grid gap-4 pb-3 lg:gap-5">
              <section className="glass-panel p-5 sm:p-6">
                <div className="shimmer h-8 w-52 rounded-xl" />
                <div className="shimmer mt-3 h-5 w-80 max-w-full rounded-lg" />
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="shimmer h-5 w-44 rounded-lg" />
                      <div className="shimmer mt-2 h-4 w-64 rounded-lg" />
                    </div>
                    <div className="shimmer h-7 w-52 rounded-full" />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-3 gap-2 sm:gap-4">
                <article className="glass-panel p-3 sm:p-5">
                  <div className="shimmer h-3 w-18 rounded-lg sm:h-4 sm:w-24" />
                  <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
                </article>
                <article className="glass-panel p-3 sm:p-5">
                  <div className="shimmer h-3 w-20 rounded-lg sm:h-4 sm:w-28" />
                  <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
                </article>
                <article className="glass-panel p-3 sm:p-5">
                  <div className="shimmer h-3 w-20 rounded-lg sm:h-4 sm:w-28" />
                  <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
                </article>
              </section>

              <section className="glass-panel p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="shimmer h-6 w-44 rounded-lg" />
                  <div className="shimmer h-4 w-16 rounded-lg" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => `skeleton-resource-${index + 1}`).map((key) => (
                    <article key={key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/3">
                      <div className="grid h-28 place-items-center border-b border-white/8 bg-gradient-to-br from-white/6 to-white/2 px-4 text-center">
                        <div className="w-full max-w-[12rem]">
                          <div className="shimmer mx-auto h-6 w-44 rounded-lg" />
                          <div className="shimmer mx-auto mt-2 h-4 w-20 rounded-lg" />
                        </div>
                      </div>
                      <div className="grid gap-2 bg-bg-900 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="shimmer h-4 w-16 rounded-lg" />
                          <div className="shimmer h-4 w-20 rounded-lg" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="shimmer h-4 w-24 rounded-lg" />
                          <div className="shimmer h-4 w-24 rounded-lg" />
                        </div>
                        <div className="shimmer h-9 w-full rounded-xl" />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <RouteSkeleton />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <RouteSkeleton />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function HomeRoute() {
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <RouteSkeleton />
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/change-password" element={<GuestRoute><ChangePasswordPage /></GuestRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/resource-launch/:resourceId" element={<ProtectedRoute><ResourceLaunchPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
      <Route path="/helpdesk" element={<ProtectedRoute><HelpDeskPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/faq" element={<ProtectedRoute><FaqPage /></ProtectedRoute>} />

      <Route path="/portal" element={<HomeRoute />} />
      <Route path="*" element={<HomeRoute />} />
    </Routes>
  )
}

export default App
