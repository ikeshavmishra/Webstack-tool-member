import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'

const faqItems = [
  {
    question: 'Is Webstack Tool a legal & safe way to use these tools?',
    answer:
      'Yes. Webstack Tool is designed as a managed workspace, not a collection of cracked or shared accounts. We work to keep usage within each product\'s fair-use and licensing rules. You\'re still expected to follow the individual terms of each tool you use.',
  },
  {
    question: 'Do I need separate accounts for each product?',
    answer:
      'No. You sign in once to Webstack Tool, and then launch products directly from the app. In some cases a tool may ask you to confirm basic details (like a profile) the first time you use it, but you don\'t manage dozens of separate subscriptions yourself.',
  },
  {
    question: 'What happens if a tool stops working?',
    answer:
      'Tools occasionally change APIs, pricing or access rules. If something breaks, our team works to restore access or provide an alternative as quickly as possible. If an issue affects your workflow, you can always reach out to support and we\'ll help you with options.',
  },
  {
    question: 'On how many devices can I use the Webstack Tool?',
    answer:
      'You can install Webstack Tool on multiple Windows devices. For security, simultaneous logins from many machines may be limited. If you need extra seats for a team, you can contact support to set up the right access.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We do have a refund and cancellation policy, which is explained in detail on the "Refund Policy" and "Cancellation Policy" pages linked in the footer. If you run into a technical issue or a tool you paid for becomes unavailable, you can open a ticket and our team will review your case.',
  },
  {
    question: 'Is this only for Windows?',
    answer:
      'Yes, right now Webstack Tool is built for Windows. Mac and browser-based experiences are on the long-term roadmap, but the current app and installer are Windows-only.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. You’re not locked into a long-term contract. You can cancel your membership from your account dashboard, and your access will continue until the end of your current billing period.',
  },
]

function FaqPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const [openIndex, setOpenIndex] = useState(0)

  useEffect(() => {
    document.title = 'FAQs - Webstack Tool'
  }, [])

  const filteredFaqs = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return faqItems
    return faqItems.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(query),
    )
  }, [searchValue])

  useEffect(() => {
    setOpenIndex(0)
  }, [searchValue])

  async function onLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <DashboardLayout
      activeItem="faq"
      onLogout={onLogout}
      onSearchChange={setSearchValue}
      searchValue={searchValue}
      user={user}
    >
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel p-5 sm:p-6">
          <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Help Center</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Frequently Asked Questions</h1>
          <p className="mt-2 text-sm text-text-300">
            Quick answers about access, devices, safety, billing, and cancellation.
          </p>
        </section>

        <section className="glass-panel p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-text-300">Showing {filteredFaqs.length} item(s)</p>
          </div>
          <div className="grid gap-3">
            {filteredFaqs.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"
                >
                  <button
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    type="button"
                  >
                    <h2 className="text-base font-semibold text-text-50 sm:text-lg">{item.question}</h2>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/12 bg-white/6 px-2 text-xs text-text-300">
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>

                  {isOpen ? (
                    <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-text-300">
                      {item.answer}
                    </p>
                  ) : null}
                </article>
              )
            })}
          </div>

          {filteredFaqs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-300">
              No FAQ matched your search.
            </p>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default FaqPage
