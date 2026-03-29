import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function initialsFromUser(user) {
  const name = String(user?.name || user?.login || '').trim()
  if (!name) return 'M'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function AppHeader({ user, searchValue = '', onSearchChange, onLogout, onMenuToggle }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const initials = initialsFromUser(user)
  const handleSearchChange = typeof onSearchChange === 'function' ? onSearchChange : () => {}
  const handleLogout = typeof onLogout === 'function' ? onLogout : () => {}
  const handleMenuToggle = typeof onMenuToggle === 'function' ? onMenuToggle : () => {}

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current || menuRef.current.contains(event.target)) return
      setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <header className="glass-panel relative z-40 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          aria-label="Open menu"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/4 text-text-300 transition hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-text-50 lg:hidden"
          onClick={handleMenuToggle}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <label className="relative min-w-0 flex-1">
          <input
            className="h-11 w-full rounded-full border border-white/10 bg-black/25 px-4 pr-11 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search any tool..."
            type="search"
            value={searchValue}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-500">⌕</span>
        </label>

        <div className="relative z-50" ref={menuRef}>
          <button
            aria-expanded={isMenuOpen}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/4 px-2.5 text-sm transition hover:border-brand-500/40 hover:bg-brand-500/10 sm:px-3"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-xs font-bold text-bg-950">
              {initials}
            </span>
            <span className="hidden max-w-[10rem] truncate text-left sm:block">
              <span className="block text-[11px] text-text-500">Hello,</span>
              <span className="block truncate font-semibold text-text-50">{user?.name || user?.login || 'Member'}</span>
            </span>
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 z-[220] mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-bg-900/98 p-3 shadow-2xl backdrop-blur-md">
              <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                <p className="text-sm font-semibold">{user?.name || user?.login || 'Member'}</p>
                <p className="truncate text-xs text-text-300">{user?.email || user?.login || ''}</p>
              </div>

              <div className="mt-2 grid gap-1">
                <Link
                  className="rounded-xl px-3 py-2 text-sm text-text-200 transition hover:bg-white/6 hover:text-text-50"
                  onClick={() => setIsMenuOpen(false)}
                  to="/settings"
                >
                  Settings
                </Link>
                <button
                  className="rounded-xl px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
