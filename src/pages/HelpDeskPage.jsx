import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'

function HelpDeskPage() {
  const { logout, user } = useAuth()

  async function onLogout() {
    await logout()
  }

  return (
    <DashboardLayout activeItem="helpdesk" onLogout={onLogout} user={user}>
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel p-5 sm:p-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Help Desk</h1>
          <p className="mt-2 text-sm text-text-300">Our support request form is being prepared.</p>
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="grid gap-3">
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-32 rounded-xl" />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default HelpDeskPage
