import { Link } from 'react-router-dom'
import icon from '/icon.png'

const primaryItems = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { key: 'transactions', label: 'Transaction History', to: '/transactions' },
  { key: 'renew', label: 'Subscribe / Renew' },
  { key: 'helpdesk', label: 'Help Desk', to: '/helpdesk' },
  { key: 'faq', label: 'FAQs', to: '/faq' },
  { key: 'settings', label: 'Settings', to: '/settings' },
]

const secondaryItems = [
  { key: 'download', label: 'How to Use' },
]

function NavItem({ item, activeItem, onNavigate }) {
  const isActive = activeItem === item.key
  const baseClass = `inline-flex h-11 items-center rounded-2xl px-4 text-sm font-medium transition ${
    isActive
      ? 'border border-brand-500/50 bg-brand-500/16 text-text-50 shadow-[0_0_0_1px_rgba(167,198,0,0.12),0_8px_18px_rgba(0,0,0,0.22)]'
      : 'border border-transparent text-text-300 hover:border-white/10 hover:bg-white/5 hover:text-text-50'
  }`

  if (item.to) {
    return (
      <Link className={baseClass} onClick={onNavigate} to={item.to}>
        {item.label}
      </Link>
    )
  }

  return (
    <button className={baseClass} onClick={onNavigate} type="button">
      {item.label}
    </button>
  )
}

function AppSidebar({ activeItem, onLogout, onNavigate }) {
  const handleSafeLogout = typeof onLogout === 'function' ? onLogout : () => {}
  return (
    <aside className="glass-panel h-auto min-h-[60vh] overflow-hidden p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="flex h-full flex-col">
        <div className="mb-2 flex justify-end lg:hidden">
          <button
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-300 transition hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-text-50"
            onClick={onNavigate}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl from-brand-300 to-brand-500 text-bg-950">
              <span className="text-sm font-extrabold">
                <img src={icon} alt="Profile Picture" />
              </span>
            </div>
            <div>
              <p className="text-xs tracking-[0.08em] text-brand-300 uppercase">Webstack Tool</p>
              <p className="text-sm font-semibold text-text-50">Member Area</p>
            </div>
          </div>
        </div>

        <nav className="grid gap-1.5">
          {primaryItems.map((item) => (
            <NavItem key={item.key} activeItem={activeItem} item={item} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="my-5 border-t border-white/10" />

        <p className="mb-2 px-1 text-[11px] tracking-[0.08em] text-text-500 uppercase">User Guide</p>
        <nav className="grid gap-1.5">
          {secondaryItems.map((item) => (
            <NavItem key={item.key} activeItem={activeItem} item={item} onNavigate={onNavigate} />
          ))}
        </nav>

        <button
          className="mt-auto inline-flex h-11 items-center justify-center rounded-2xl border border-rose-400/35 bg-rose-500/8 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
          onClick={() => {
            if (typeof onNavigate === 'function') onNavigate()
            handleSafeLogout()
          }}
          type="button"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar
