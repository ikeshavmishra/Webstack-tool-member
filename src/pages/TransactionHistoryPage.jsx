import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'
import {
  createInvoiceAccessCacheKey,
  createPaymentsCacheKey,
  useMemberStore,
} from '../store/memberStore.js'

const DEFAULT_PER_PAGE = 10
const DEFAULT_PAYLOAD = {
  items: [],
  pagination: { page: 1, total_pages: 1, total: 0 },
}

function formatCurrency(value, currency = 'USD') {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return `${currency} 0.00`

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(currency || 'USD'),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${String(currency || 'USD')} ${amount.toFixed(2)}`
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function paymentStatusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'paid') {
    return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200'
  }
  if (normalized === 'refunded') {
    return 'border-rose-400/35 bg-rose-500/12 text-rose-200'
  }
  if (normalized === 'partial_refund') {
    return 'border-amber-400/35 bg-amber-500/12 text-amber-200'
  }
  return 'border-white/12 bg-white/6 text-text-200'
}

function accessStatusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'active') {
    return 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200'
  }
  if (normalized === 'future') {
    return 'border-sky-400/35 bg-sky-500/12 text-sky-200'
  }
  return 'border-rose-400/35 bg-rose-500/12 text-rose-200'
}

function toTitleCase(value) {
  return String(value || '')
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function TransactionHistoryPage() {
  const { logout, user } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  const [paymentsStatus, setPaymentsStatus] = useState('all')
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsReloadToken, setPaymentsReloadToken] = useState(0)

  const [accessStatus, setAccessStatus] = useState('all')
  const [accessPage, setAccessPage] = useState(1)
  const [accessReloadToken, setAccessReloadToken] = useState(0)
  const loadPayments = useMemberStore((state) => state.loadPayments)
  const loadInvoiceAccess = useMemberStore((state) => state.loadInvoiceAccess)

  const paymentsKey = useMemo(
    () => createPaymentsCacheKey({ page: paymentsPage, perPage: DEFAULT_PER_PAGE, status: paymentsStatus }),
    [paymentsPage, paymentsStatus],
  )
  const accessKey = useMemo(
    () => createInvoiceAccessCacheKey({ page: accessPage, perPage: DEFAULT_PER_PAGE, status: accessStatus }),
    [accessPage, accessStatus],
  )

  const paymentsCachedPayload = useMemberStore((state) => state.paymentsByKey[paymentsKey] || null)
  const isPaymentsLoadingState = useMemberStore((state) => Boolean(state.paymentsLoadingByKey[paymentsKey]))
  const paymentsError = useMemberStore((state) => state.paymentsErrorByKey[paymentsKey] || '')
  const paymentsPayload = paymentsCachedPayload || DEFAULT_PAYLOAD
  const isPaymentsLoading = isPaymentsLoadingState || paymentsCachedPayload === null

  const accessCachedPayload = useMemberStore((state) => state.invoiceAccessByKey[accessKey] || null)
  const isAccessLoadingState = useMemberStore((state) => Boolean(state.invoiceAccessLoadingByKey[accessKey]))
  const accessError = useMemberStore((state) => state.invoiceAccessErrorByKey[accessKey] || '')
  const accessPayload = accessCachedPayload || DEFAULT_PAYLOAD
  const isAccessLoading = isAccessLoadingState || accessCachedPayload === null

  useEffect(() => {
    document.title = 'Transaction History - Webstack Tool'
  }, [])

  useEffect(() => {
    let active = true

    async function runLoadPayments() {
      try {
        await loadPayments({
          page: paymentsPage,
          perPage: DEFAULT_PER_PAGE,
          status: paymentsStatus,
          force: paymentsReloadToken > 0,
        })
      } catch {
        if (!active) return
      }
    }

    runLoadPayments().catch(() => {})
    return () => {
      active = false
    }
  }, [loadPayments, paymentsPage, paymentsStatus, paymentsReloadToken])

  useEffect(() => {
    let active = true

    async function runLoadInvoiceAccess() {
      try {
        await loadInvoiceAccess({
          page: accessPage,
          perPage: DEFAULT_PER_PAGE,
          status: accessStatus,
          force: accessReloadToken > 0,
        })
      } catch {
        if (!active) return
      }
    }

    runLoadInvoiceAccess().catch(() => {})
    return () => {
      active = false
    }
  }, [accessPage, accessStatus, accessReloadToken, loadInvoiceAccess])

  const filteredPayments = useMemo(() => {
    const items = Array.isArray(paymentsPayload?.items) ? paymentsPayload.items : []
    const query = searchValue.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      const haystack = [
        item?.invoice_display,
        item?.invoice_public_id,
        item?.receipt_id,
        item?.products,
        item?.paysys_id,
        item?.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [paymentsPayload?.items, searchValue])

  const filteredAccessInvoices = useMemo(() => {
    const items = Array.isArray(accessPayload?.items) ? accessPayload.items : []
    const query = searchValue.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      const accessText = Array.isArray(item?.access_items)
        ? item.access_items.map((entry) => [entry?.product_title, entry?.status].filter(Boolean).join(' ')).join(' ')
        : ''

      const haystack = [
        item?.invoice_public_id,
        item?.products,
        item?.paysys_id,
        item?.currency,
        accessText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [accessPayload?.items, searchValue])

  const paymentSummary = useMemo(() => {
    const items = Array.isArray(paymentsPayload?.items) ? paymentsPayload.items : []
    return {
      records: Number(paymentsPayload?.pagination?.total || 0),
      paidAmount: items.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
      refundAmount: items.reduce((sum, item) => sum + Number(item?.refund_amount || 0), 0),
      netAmount: items.reduce((sum, item) => sum + Number(item?.net_amount || 0), 0),
      currency: items[0]?.currency || 'USD',
    }
  }, [paymentsPayload?.items, paymentsPayload?.pagination?.total])

  const accessSummary = useMemo(() => {
    const items = Array.isArray(accessPayload?.items) ? accessPayload.items : []
    return {
      invoices: Number(accessPayload?.pagination?.total || 0),
      active: items.reduce((sum, item) => sum + Number(item?.access_summary?.active || 0), 0),
      future: items.reduce((sum, item) => sum + Number(item?.access_summary?.future || 0), 0),
      expired: items.reduce((sum, item) => sum + Number(item?.access_summary?.expired || 0), 0),
    }
  }, [accessPayload?.items, accessPayload?.pagination?.total])

  async function onLogout() {
    await logout()
  }

  function renderPager({ loading, pagination, onPrev, onNext }) {
    const page = Number(pagination?.page || 1)
    const totalPages = Math.max(1, Number(pagination?.total_pages || 1))

    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/12 bg-white/6 px-3 text-xs font-semibold text-text-100 transition hover:border-brand-500/40 hover:bg-brand-500/12 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || page <= 1}
            onClick={onPrev}
            type="button"
          >
            Previous
          </button>
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/12 bg-white/6 px-3 text-xs font-semibold text-text-100 transition hover:border-brand-500/40 hover:bg-brand-500/12 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || page >= totalPages}
            onClick={onNext}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      activeItem="transactions"
      onLogout={onLogout}
      onSearchChange={setSearchValue}
      searchValue={searchValue}
      user={user}
    >
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel p-5 sm:p-6">
          <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Billing</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Transaction History</h1>
          <p className="mt-2 text-sm text-text-300">View your payment and invoice access history.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="glass-panel p-5">
            <p className="text-xs tracking-[0.08em] text-text-500 uppercase">Payment Records</p>
            {isPaymentsLoading ? <div className="shimmer mt-3 h-9 w-16 rounded-lg" /> : <p className="mt-3 text-3xl font-semibold">{paymentSummary.records}</p>}
          </article>
          <article className="glass-panel p-5">
            <p className="text-xs tracking-[0.08em] text-text-500 uppercase">Paid Amount</p>
            {isPaymentsLoading ? <div className="shimmer mt-3 h-9 w-24 rounded-lg" /> : <p className="mt-3 text-lg font-semibold">{formatCurrency(paymentSummary.paidAmount, paymentSummary.currency)}</p>}
          </article>
          <article className="glass-panel p-5">
            <p className="text-xs tracking-[0.08em] text-text-500 uppercase">Invoice Records</p>
            {isAccessLoading ? <div className="shimmer mt-3 h-9 w-16 rounded-lg" /> : <p className="mt-3 text-3xl font-semibold">{accessSummary.invoices}</p>}
          </article>
          <article className="glass-panel p-5">
            <p className="text-xs tracking-[0.08em] text-text-500 uppercase">Active Access</p>
            {isAccessLoading ? <div className="shimmer mt-3 h-9 w-16 rounded-lg" /> : <p className="mt-3 text-3xl font-semibold">{accessSummary.active}</p>}
          </article>
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">Payments</h2>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-white/12 bg-white/6 px-2.5 text-xs text-text-100 outline-none transition focus:border-brand-500/45"
                onChange={(event) => {
                  setPaymentsStatus(event.target.value)
                  setPaymentsPage(1)
                }}
                style={{ colorScheme: 'dark' }}
                value={paymentsStatus}
              >
                <option className="bg-bg-900 text-text-100" value="all">All</option>
                <option className="bg-bg-900 text-text-100" value="paid">Paid</option>
                <option className="bg-bg-900 text-text-100" value="refunded">Refunded</option>
                <option className="bg-bg-900 text-text-100" value="partial_refund">Partial Refund</option>
              </select>
              <button
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/12 bg-white/6 px-3 text-xs font-semibold text-text-100 transition hover:border-brand-500/40 hover:bg-brand-500/12"
                onClick={() => setPaymentsReloadToken((value) => value + 1)}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {isPaymentsLoading ? (
              <>
                <div className="shimmer h-32 rounded-2xl" />
                <div className="shimmer h-32 rounded-2xl" />
                <div className="shimmer h-32 rounded-2xl" />
              </>
            ) : paymentsError ? (
              <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{paymentsError}</div>
            ) : filteredPayments.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-300">No payments found.</p>
            ) : (
              filteredPayments.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{item.invoice_display || `Invoice #${item.invoice_id}`}</p>
                      <p className="mt-1 text-xs text-text-400">{formatDateTime(item.paid_at)}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(item.status)}`}>
                      {toTitleCase(item.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-text-300 sm:grid-cols-2 xl:grid-cols-4">
                    <p>Paid: {formatCurrency(item.amount, item.currency)}</p>
                    <p>Refund: {formatCurrency(item.refund_amount, item.currency)}</p>
                    <p>Net: {formatCurrency(item.net_amount, item.currency)}</p>
                    <p>Gateway: {item.paysys_id || '-'}</p>
                  </div>

                  <p className="mt-2 text-xs text-text-500">Receipt: {item.receipt_id || '-'}</p>
                  {item.products ? <p className="mt-1 truncate text-xs text-text-500">{item.products}</p> : null}
                </article>
              ))
            )}
          </div>

          {renderPager({
            loading: isPaymentsLoading,
            pagination: paymentsPayload?.pagination,
            onPrev: () => setPaymentsPage((page) => Math.max(1, page - 1)),
            onNext: () => setPaymentsPage((page) => page + 1),
          })}
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">Invoice Access</h2>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-lg border border-white/12 bg-white/6 px-2.5 text-xs text-text-100 outline-none transition focus:border-brand-500/45"
                onChange={(event) => {
                  setAccessStatus(event.target.value)
                  setAccessPage(1)
                }}
                style={{ colorScheme: 'dark' }}
                value={accessStatus}
              >
                <option className="bg-bg-900 text-text-100" value="all">All</option>
                <option className="bg-bg-900 text-text-100" value="active">Active</option>
                <option className="bg-bg-900 text-text-100" value="expired">Expired</option>
              </select>
              <button
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/12 bg-white/6 px-3 text-xs font-semibold text-text-100 transition hover:border-brand-500/40 hover:bg-brand-500/12"
                onClick={() => setAccessReloadToken((value) => value + 1)}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {isAccessLoading ? (
              <>
                <div className="shimmer h-40 rounded-2xl" />
                <div className="shimmer h-40 rounded-2xl" />
              </>
            ) : accessError ? (
              <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{accessError}</div>
            ) : filteredAccessInvoices.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-300">No invoice access records found for this filter.</p>
            ) : (
              filteredAccessInvoices.map((item) => (
                <article key={item.invoice_id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{item.invoice_public_id || `Invoice #${item.invoice_id}`}</p>
                      <p className="mt-1 text-xs text-text-400">Created: {formatDateTime(item.tm_added)}</p>
                    </div>
                    <p className="text-sm font-semibold text-text-100">{formatCurrency(item.first_total, item.currency)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      Active {Number(item?.access_summary?.active || 0)}
                    </span>
                    <span className="inline-flex rounded-full border border-sky-400/35 bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-200">
                      Future {Number(item?.access_summary?.future || 0)}
                    </span>
                    <span className="inline-flex rounded-full border border-rose-400/35 bg-rose-500/12 px-2.5 py-1 text-xs font-semibold text-rose-200">
                      Expired {Number(item?.access_summary?.expired || 0)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-text-400">
                    <p>Gateway: {item.paysys_id || '-'}</p>
                  </div>

                  {Array.isArray(item?.access_items) && item.access_items.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {item.access_items.slice(0, 4).map((accessItem) => (
                        <div
                          key={accessItem.access_id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-100">{accessItem.product_title || 'Product'}</p>
                            <p className="text-xs text-text-400">
                              {formatDate(accessItem.begin_date)} to {formatDate(accessItem.expire_date)}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${accessStatusClass(accessItem.status)}`}>
                            {toTitleCase(accessItem.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {item.products ? <p className="mt-3 truncate text-xs text-text-500">{item.products}</p> : null}
                </article>
              ))
            )}
          </div>

          {renderPager({
            loading: isAccessLoading,
            pagination: accessPayload?.pagination,
            onPrev: () => setAccessPage((page) => Math.max(1, page - 1)),
            onNext: () => setAccessPage((page) => page + 1),
          })}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default TransactionHistoryPage
