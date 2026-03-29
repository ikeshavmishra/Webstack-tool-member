import { useEffect, useState } from 'react'
import AppHeader from './AppHeader.jsx'
import AppSidebar from './AppSidebar.jsx'

function DashboardLayout({
  user,
  activeItem = 'dashboard',
  searchValue = '',
  onSearchChange,
  onLogout,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const handleSearchChange = typeof onSearchChange === 'function' ? onSearchChange : () => {}

  useEffect(() => {
    if (!isSidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarOpen])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="app-canvas min-h-screen text-text-50">
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? '' : 'pointer-events-none'}`}>
        <button
          aria-label="Close sidebar"
          className={`absolute inset-0 bg-black/60 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
        <div
          className={`absolute left-0 top-0 h-full w-[86vw] max-w-[320px] p-3 transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AppSidebar activeItem={activeItem} onLogout={onLogout} onNavigate={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      <div className="relative min-h-screen w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        <div className="relative z-30 mb-4 hidden lg:fixed lg:inset-y-5 lg:left-5 lg:mb-0 lg:block lg:w-[280px]">
          <AppSidebar activeItem={activeItem} onLogout={onLogout} />
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4 lg:ml-[300px] lg:gap-5">
          <AppHeader
            onMenuToggle={() => setIsSidebarOpen(true)}
            onLogout={onLogout}
            onSearchChange={handleSearchChange}
            searchValue={searchValue}
            user={user}
          />
          <main className="min-h-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
