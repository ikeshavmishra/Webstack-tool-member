import { create } from 'zustand'
import {
  fetchDashboard,
  fetchInvoiceAccess,
  fetchPayments,
  fetchResourceLaunch,
  fetchResources,
} from '../lib/memberApi.js'

const DASHBOARD_TTL_MS = 60000
const RESOURCES_TTL_MS = 60000
const RESOURCE_LAUNCH_TTL_MS = 120000
const TRANSACTION_TTL_MS = 45000

const inFlight = {
  dashboard: null,
  resources: null,
  dashboardBundle: null,
  resourceLaunch: new Map(),
  payments: new Map(),
  invoiceAccess: new Map(),
}

function isFresh(fetchedAt, ttlMs) {
  const ts = Number(fetchedAt || 0)
  return ts > 0 && (Date.now() - ts) < ttlMs
}

function withKeyFlag(map, key, value) {
  return { ...(map || {}), [key]: value }
}

export function createPaymentsCacheKey({ page = 1, perPage = 10, status = 'all' } = {}) {
  return `${String(status || 'all')}|${Number(page || 1)}|${Number(perPage || 10)}`
}

export const createInvoiceAccessCacheKey = createPaymentsCacheKey

export const useMemberStore = create((set, get) => ({
  dashboard: null,
  dashboardFetchedAt: 0,
  isDashboardLoading: false,
  dashboardError: '',

  resources: null,
  resourcesFetchedAt: 0,
  isResourcesLoading: false,
  resourcesError: '',

  resourceLaunchById: {},
  resourceLaunchFetchedAtById: {},
  resourceLaunchLoadingById: {},
  resourceLaunchErrorById: {},

  paymentsByKey: {},
  paymentsFetchedAtByKey: {},
  paymentsLoadingByKey: {},
  paymentsErrorByKey: {},

  invoiceAccessByKey: {},
  invoiceAccessFetchedAtByKey: {},
  invoiceAccessLoadingByKey: {},
  invoiceAccessErrorByKey: {},

  loadDashboard: async ({ force = false } = {}) => {
    const state = get()
    if (!force && state.dashboard && isFresh(state.dashboardFetchedAt, DASHBOARD_TTL_MS)) {
      return state.dashboard
    }

    if (inFlight.dashboard) {
      return inFlight.dashboard
    }

    set({ isDashboardLoading: true, dashboardError: '' })

    const request = fetchDashboard()
      .then((payload) => {
        set({
          dashboard: payload || null,
          dashboardFetchedAt: Date.now(),
          dashboardError: '',
        })
        return payload
      })
      .catch((error) => {
        set({ dashboardError: 'Unable to load dashboard data right now. Please try again.' })
        throw error
      })
      .finally(() => {
        set({ isDashboardLoading: false })
        inFlight.dashboard = null
      })

    inFlight.dashboard = request
    return request
  },

  loadResources: async ({ force = false } = {}) => {
    const state = get()
    if (!force && state.resources && isFresh(state.resourcesFetchedAt, RESOURCES_TTL_MS)) {
      return state.resources
    }

    if (inFlight.resources) {
      return inFlight.resources
    }

    set({ isResourcesLoading: true, resourcesError: '' })

    const request = fetchResources()
      .then((payload) => {
        set({
          resources: payload || null,
          resourcesFetchedAt: Date.now(),
          resourcesError: '',
        })
        return payload
      })
      .catch((error) => {
        set({ resourcesError: 'Unable to load resources right now. Please try again.' })
        throw error
      })
      .finally(() => {
        set({ isResourcesLoading: false })
        inFlight.resources = null
      })

    inFlight.resources = request
    return request
  },

  loadDashboardBundle: async ({ force = false } = {}) => {
    if (inFlight.dashboardBundle) {
      return inFlight.dashboardBundle
    }

    const request = Promise.all([
      get().loadDashboard({ force }),
      get().loadResources({ force }),
    ])
      .then(([dashboard, resources]) => ({ dashboard, resources }))
      .finally(() => {
        inFlight.dashboardBundle = null
      })

    inFlight.dashboardBundle = request
    return request
  },

  loadResourceLaunch: async (resourceId, { force = false } = {}) => {
    const key = String(resourceId || '').trim()
    if (!key) {
      throw new Error('Resource id is required.')
    }

    const state = get()
    const currentPayload = state.resourceLaunchById?.[key] || null
    const fetchedAt = Number(state.resourceLaunchFetchedAtById?.[key] || 0)
    if (!force && currentPayload && isFresh(fetchedAt, RESOURCE_LAUNCH_TTL_MS)) {
      return currentPayload
    }

    if (inFlight.resourceLaunch.has(key)) {
      return inFlight.resourceLaunch.get(key)
    }

    set((prev) => ({
      resourceLaunchLoadingById: withKeyFlag(prev.resourceLaunchLoadingById, key, true),
      resourceLaunchErrorById: withKeyFlag(prev.resourceLaunchErrorById, key, ''),
    }))

    const request = fetchResourceLaunch(key)
      .then((payload) => {
        set((prev) => ({
          resourceLaunchById: withKeyFlag(prev.resourceLaunchById, key, payload || null),
          resourceLaunchFetchedAtById: withKeyFlag(prev.resourceLaunchFetchedAtById, key, Date.now()),
          resourceLaunchErrorById: withKeyFlag(prev.resourceLaunchErrorById, key, ''),
        }))
        return payload
      })
      .catch((error) => {
        set((prev) => ({
          resourceLaunchErrorById: withKeyFlag(
            prev.resourceLaunchErrorById,
            key,
            'Unable to open this resource right now. Please try again.',
          ),
        }))
        throw error
      })
      .finally(() => {
        set((prev) => ({
          resourceLaunchLoadingById: withKeyFlag(prev.resourceLaunchLoadingById, key, false),
        }))
        inFlight.resourceLaunch.delete(key)
      })

    inFlight.resourceLaunch.set(key, request)
    return request
  },

  loadPayments: async ({ page = 1, perPage = 10, status = 'all', force = false } = {}) => {
    const key = createPaymentsCacheKey({ page, perPage, status })
    const state = get()
    const currentPayload = state.paymentsByKey?.[key] || null
    const fetchedAt = Number(state.paymentsFetchedAtByKey?.[key] || 0)
    if (!force && currentPayload && isFresh(fetchedAt, TRANSACTION_TTL_MS)) {
      return currentPayload
    }

    if (inFlight.payments.has(key)) {
      return inFlight.payments.get(key)
    }

    set((prev) => ({
      paymentsLoadingByKey: withKeyFlag(prev.paymentsLoadingByKey, key, true),
      paymentsErrorByKey: withKeyFlag(prev.paymentsErrorByKey, key, ''),
    }))

    const request = fetchPayments({ page, perPage, status })
      .then((payload) => {
        const normalized = payload || { items: [], pagination: { page: 1, total_pages: 1, total: 0 } }
        set((prev) => ({
          paymentsByKey: withKeyFlag(prev.paymentsByKey, key, normalized),
          paymentsFetchedAtByKey: withKeyFlag(prev.paymentsFetchedAtByKey, key, Date.now()),
          paymentsErrorByKey: withKeyFlag(prev.paymentsErrorByKey, key, ''),
        }))
        return normalized
      })
      .catch((error) => {
        set((prev) => ({
          paymentsErrorByKey: withKeyFlag(prev.paymentsErrorByKey, key, 'Unable to load payments right now. Please try again.'),
        }))
        throw error
      })
      .finally(() => {
        set((prev) => ({
          paymentsLoadingByKey: withKeyFlag(prev.paymentsLoadingByKey, key, false),
        }))
        inFlight.payments.delete(key)
      })

    inFlight.payments.set(key, request)
    return request
  },

  loadInvoiceAccess: async ({ page = 1, perPage = 10, status = 'all', force = false } = {}) => {
    const key = createInvoiceAccessCacheKey({ page, perPage, status })
    const state = get()
    const currentPayload = state.invoiceAccessByKey?.[key] || null
    const fetchedAt = Number(state.invoiceAccessFetchedAtByKey?.[key] || 0)
    if (!force && currentPayload && isFresh(fetchedAt, TRANSACTION_TTL_MS)) {
      return currentPayload
    }

    if (inFlight.invoiceAccess.has(key)) {
      return inFlight.invoiceAccess.get(key)
    }

    set((prev) => ({
      invoiceAccessLoadingByKey: withKeyFlag(prev.invoiceAccessLoadingByKey, key, true),
      invoiceAccessErrorByKey: withKeyFlag(prev.invoiceAccessErrorByKey, key, ''),
    }))

    const request = fetchInvoiceAccess({ page, perPage, status })
      .then((payload) => {
        const normalized = payload || { items: [], pagination: { page: 1, total_pages: 1, total: 0 } }
        set((prev) => ({
          invoiceAccessByKey: withKeyFlag(prev.invoiceAccessByKey, key, normalized),
          invoiceAccessFetchedAtByKey: withKeyFlag(prev.invoiceAccessFetchedAtByKey, key, Date.now()),
          invoiceAccessErrorByKey: withKeyFlag(prev.invoiceAccessErrorByKey, key, ''),
        }))
        return normalized
      })
      .catch((error) => {
        set((prev) => ({
          invoiceAccessErrorByKey: withKeyFlag(prev.invoiceAccessErrorByKey, key, 'Unable to load invoice access data right now. Please try again.'),
        }))
        throw error
      })
      .finally(() => {
        set((prev) => ({
          invoiceAccessLoadingByKey: withKeyFlag(prev.invoiceAccessLoadingByKey, key, false),
        }))
        inFlight.invoiceAccess.delete(key)
      })

    inFlight.invoiceAccess.set(key, request)
    return request
  },
}))
