import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'
import { useMemberStore } from '../store/memberStore.js'

function DashboardPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const dashboard = useMemberStore((state) => state.dashboard)
  const resourcesPayload = useMemberStore((state) => state.resources)
  const isDashboardLoading = useMemberStore((state) => state.isDashboardLoading)
  const isResourcesLoading = useMemberStore((state) => state.isResourcesLoading)
  const dashboardError = useMemberStore((state) => state.dashboardError)
  const resourcesError = useMemberStore((state) => state.resourcesError)
  const loadDashboardBundle = useMemberStore((state) => state.loadDashboardBundle)
  const [actionError, setActionError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const isLoadingData = isDashboardLoading || isResourcesLoading || !dashboard || !resourcesPayload
  const error = dashboardError || resourcesError

  useEffect(() => {
    document.title = 'Dashboard - Webstack Tool'
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setActionError('')
      try {
        await loadDashboardBundle({ force: reloadToken > 0 })
      } catch {
        if (!active) return
      }
    }

    load()
    return () => {
      active = false
    }
  }, [loadDashboardBundle, reloadToken])

  const allActiveResources = useMemo(() => {
    return Array.isArray(resourcesPayload?.items) ? resourcesPayload.items : []
  }, [resourcesPayload?.items])

  const filteredActiveResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allActiveResources

    return allActiveResources.filter((item) => {
      const haystack = [
        item?.title,
        item?.resource_type,
        item?.category_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [allActiveResources, searchQuery])

  const activePlanLabel = useMemo(
    () => (dashboard?.active_plan_name ? `Active Plan: ${dashboard.active_plan_name}` : 'Active Plan: Free'),
    [dashboard?.active_plan_name],
  )

  const resourceSkeletonKeys = useMemo(
    () => ['resource-skeleton-1', 'resource-skeleton-2', 'resource-skeleton-3', 'resource-skeleton-4'],
    [],
  )

  async function onLogout() {
    await logout()
  }

  function onOpenResource(resource) {
    const nextResourceId = String(resource?.resource_id || '').trim()
    if (!nextResourceId) {
      setActionError('Resource is not available right now.')
      return
    }

    setActionError('')
    navigate(`/resource-launch/${encodeURIComponent(nextResourceId)}`)
  }

  return (
    <DashboardLayout
      activeItem="dashboard"
      onLogout={onLogout}
      onSearchChange={setSearchQuery}
      searchValue={searchQuery}
      user={user}
    >
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel p-5 sm:p-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm text-text-300">Manage your active resources, billing activity, and account access.</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {isLoadingData ? (
                  <>
                    <div className="shimmer h-5 w-44 rounded-lg" />
                    <div className="shimmer mt-2 h-4 w-64 rounded-lg" />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">👋 Hey, {dashboard?.user_full_name || user?.name || user?.login || 'Member'}</p>
                    <p className="mt-1 text-xs text-text-300">Welcome back! Your resources and access data are ready.</p>
                  </>
                )}
              </div>
              {isLoadingData ? (
                <div className="shimmer h-7 w-52 rounded-full" />
              ) : (
                <span className="inline-flex rounded-full border border-brand-500/40 bg-brand-500/12 px-3 py-1 text-xs font-semibold text-brand-300">
                  {activePlanLabel}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          <article className="glass-panel p-3 sm:p-5">
            <p className="text-[10px] tracking-[0.08em] text-text-500 uppercase sm:text-xs">Subscriptions</p>
            {isLoadingData ? (
              <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
            ) : (
              <p className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-4xl">{Number(resourcesPayload?.subscriptions_count || 0)}</p>
            )}
          </article>
          <article className="glass-panel p-3 sm:p-5">
            <p className="text-[10px] tracking-[0.08em] text-text-500 uppercase sm:text-xs">Free Resources</p>
            {isLoadingData ? (
              <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
            ) : (
              <p className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-4xl">{Number(resourcesPayload?.free_resources_count || 0)}</p>
            )}
          </article>
          <article className="glass-panel p-3 sm:p-5">
            <p className="text-[10px] tracking-[0.08em] text-text-500 uppercase sm:text-xs">Plan Resources</p>
            {isLoadingData ? (
              <div className="shimmer mt-2 h-8 w-10 rounded-lg sm:mt-3 sm:h-10 sm:w-14" />
            ) : (
              <p className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-4xl">{Number(resourcesPayload?.plan_resources_count || 0)}</p>
            )}
          </article>
        </section>

        <section className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">Active Resources</h2>
            {isLoadingData ? (
              <div className="shimmer h-4 w-16 rounded-lg" />
            ) : (
              <p className="text-xs text-text-500">{filteredActiveResources.length} tool(s)</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {isLoadingData
              ? resourceSkeletonKeys.map((key) => (
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
                    <div className="flex items-center justify-between">
                      <div className="shimmer h-4 w-18 rounded-lg" />
                      <div className="shimmer h-4 w-16 rounded-lg" />
                    </div>
                    <div className="shimmer h-9 w-full rounded-xl" />
                  </div>
                </article>
              ))
              : filteredActiveResources.map((resource) => (
                <article
                  key={`${resource.resource_type}-${resource.resource_id}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/3"
                >
                  <div className="grid h-28 place-items-center border-b border-white/8 bg-gradient-to-br from-white/6 to-white/2 px-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{resource.title || 'Resource'}</p>
                      <p className="mt-1 text-xs text-text-500">{resource.category_name || 'General'}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 bg-bg-900 px-3 py-2">
                    <div className="flex items-center justify-between text-[11px] text-text-300">
                      <span className="text-text-500">Access</span>
                      <span className="max-w-[70%] truncate text-right text-text-200">{String(resource?.plan_name || 'Free')}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-300">
                      <span className="text-text-500">Active</span>
                      <span className="max-w-[70%] truncate text-right text-text-200">{String(resource?.plan_name || 'Free').toLowerCase() === 'free' ? 'Life Time' : 'Yes'}</span>
                    </div>
                    <button
                      className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand-500/15 text-xs font-semibold text-brand-300 transition hover:bg-brand-500/25"
                      onClick={() => onOpenResource(resource)}
                      type="button"
                    >
                      Open {resource.title || 'Resource'}
                    </button>
                  </div>
                </article>
              ))}
          </div>

          {!isLoadingData && filteredActiveResources.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-text-300">
              No resources match your search.
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button
                className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                onClick={() => setReloadToken((value) => value + 1)}
                type="button"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
        {actionError ? (
          <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {actionError}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
