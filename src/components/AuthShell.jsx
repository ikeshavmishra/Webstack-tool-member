import { Link } from 'react-router-dom'

const highlights = [
  'Track subscriptions, renewals, and invoices in one place.',
  'Manage billing identity and account security quickly.',
  'Instant access to member-only products and updates.',
]

function AuthShell({
  eyebrow,
  title,
  description,
  switchLabel,
  switchCta,
  switchTo,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-950 text-text-50">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(167,198,0,0.25) 0%, rgba(167,198,0,0) 72%)' }}
      />
      <div
        className="pointer-events-none absolute -right-28 top-24 h-[22rem] w-[22rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(167,198,0,0.16) 0%, rgba(167,198,0,0) 70%)' }}
      />

      <main className="relative mx-auto grid min-h-screen w-full max-w-[1220px] grid-cols-1 items-center gap-6 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="glass-panel hidden overflow-hidden p-8 lg:block lg:p-10">
          <div className="grid gap-5">
            <span className="inline-flex w-fit rounded-full border border-brand-500/45 bg-brand-500/10 px-3 py-1 text-xs font-semibold tracking-[0.11em] text-brand-300 uppercase">
              Webstack Tool Member Portal
            </span>
            <h1 className="max-w-[16ch] text-3xl leading-tight font-semibold sm:text-4xl">
              Manage your member account in one secure place.
            </h1>
            <p className="max-w-[48ch] text-sm leading-relaxed text-text-300 sm:text-base">
              Access resources, manage profile details, and track billing history with a clean and simple experience.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-white/2 px-4 py-3 transition duration-300 hover:border-brand-500/45 hover:bg-brand-500/8"
              >
                <span className="mt-[2px] inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/90 text-[10px] font-bold text-bg-950">
                  ✓
                </span>
                <p className="text-sm leading-relaxed text-text-200 transition group-hover:text-text-50">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel order-1 mx-auto w-full max-w-[640px] p-5 sm:p-8 lg:order-2">
          <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-brand-300 uppercase">{eyebrow}</p>
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-text-300">{description}</p>

          <div className="mt-7">{children}</div>

          <p className="mt-6 text-sm text-text-300">
            {switchLabel}{' '}
            <Link className="font-semibold text-brand-300 transition hover:text-brand-400" to={switchTo}>
              {switchCta}
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}

export default AuthShell
