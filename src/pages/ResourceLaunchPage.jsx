import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'
import { ApiClientError } from '../lib/apiClient.js'
import { useMemberStore } from '../store/memberStore.js'

function normalizeCategory(value) {
  const category = String(value || '').trim()
  return category || 'General'
}

function buildLaunchFrameDocument(rawHtml) {
  const html = String(rawHtml || '').trim()
  if (!html) return ''

  const helperStyle = `
<style id="wst-launch-helper-style">
  html, body {
    min-height: 0 !important;
    height: auto !important;
  }
</style>`

  const resizeScript = `
<script>
  (function () {
    function reportHeight() {
      try {
        var body = document.body;
        var html = document.documentElement;
        var nextHeight = Math.max(
          body ? body.scrollHeight : 0,
          html ? html.scrollHeight : 0
        );
        parent.postMessage({ type: 'wst-launch-height', height: nextHeight }, '*');
      } catch (error) {
        void error;
      }
    }

    window.addEventListener('load', function () {
      reportHeight();
      setTimeout(reportHeight, 120);
      setTimeout(reportHeight, 500);
    });
    window.addEventListener('resize', reportHeight);

    if (typeof ResizeObserver === 'function' && document.documentElement) {
      var observer = new ResizeObserver(reportHeight);
      observer.observe(document.documentElement);
    }

    if (typeof MutationObserver === 'function' && document.documentElement) {
      var mutationObserver = new MutationObserver(reportHeight);
      mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    window.addEventListener('message', function (event) {
      if (event && event.data && event.data.type === 'wst-launch-measure') {
        reportHeight();
      }
    });
  })();
</script>`

  const bridgeScript = `
<script>
  (function () {
    if (!window.webstack) {
      window.webstack = {};
    }

    var isDesktopApp = false;
    var pendingEnvRequestId = null;
    var pendingOpenSiteRequests = {};

    function nextRequestId(prefix) {
      return String(prefix || 'wst') + '_' + Date.now() + '_' + Math.random().toString(16).slice(2);
    }

    window.webstack.isDesktopApp = function () {
      return isDesktopApp;
    };

    window.webstack.openSite = function (siteId) {
      return new Promise(function (resolve, reject) {
        var requestId = nextRequestId('open_site');
        pendingOpenSiteRequests[requestId] = { resolve: resolve, reject: reject };
        parent.postMessage({ type: 'wst-open-site', requestId: requestId, siteId: siteId }, '*');
      });
    };

    window.addEventListener('message', function (event) {
      var data = event && event.data ? event.data : {};
      var type = String(data.type || '');

      if (type === 'wst-env-response') {
        if (pendingEnvRequestId && String(data.requestId || '') === pendingEnvRequestId) {
          isDesktopApp = Boolean(data.isDesktopApp);
          pendingEnvRequestId = null;
        }
        return;
      }

      if (type === 'wst-open-site-result') {
        var requestId = String(data.requestId || '');
        var pending = pendingOpenSiteRequests[requestId];
        if (!pending) return;
        delete pendingOpenSiteRequests[requestId];

        if (data.ok) {
          pending.resolve({ ok: true });
          return;
        }

        pending.reject(new Error(String(data.error || 'Failed to open site.')));
      }
    });

    pendingEnvRequestId = nextRequestId('env');
    parent.postMessage({ type: 'wst-env-request', requestId: pendingEnvRequestId }, '*');
  })();
</script>`

  if (/<html[\s>]/i.test(html)) {
    let nextHtml = html
    if (/<\/head>/i.test(nextHtml)) {
      nextHtml = nextHtml.replace(/<\/head>/i, `${helperStyle}</head>`)
    } else {
      nextHtml = `${helperStyle}${nextHtml}`
    }

    if (/<\/body>/i.test(nextHtml)) {
      return nextHtml.replace(/<\/body>/i, `${bridgeScript}${resizeScript}</body>`)
    }
    return `${nextHtml}${bridgeScript}${resizeScript}`
  }

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${helperStyle}</head><body>${html}${bridgeScript}${resizeScript}</body></html>`
}

function ResourceLaunchPage() {
  const navigate = useNavigate()
  const { resourceId } = useParams()
  const { logout, user } = useAuth()
  const loadResourceLaunch = useMemberStore((state) => state.loadResourceLaunch)
  const loadResources = useMemberStore((state) => state.loadResources)

  const [searchValue, setSearchValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [launchPayload, setLaunchPayload] = useState(null)
  const [allResources, setAllResources] = useState([])
  const [relatedSlideStart, setRelatedSlideStart] = useState(0)
  const [relatedVisibleCount, setRelatedVisibleCount] = useState(4)
  const [reloadToken, setReloadToken] = useState(0)
  const [frameHeight, setFrameHeight] = useState(360)
  const iframeRef = useRef(null)
  const resource = launchPayload || null
  const contentHtml = useMemo(
    () => buildLaunchFrameDocument(resource?.html),
    [resource?.html],
  )

  useEffect(() => {
    let active = true

    async function loadResource() {
      setIsLoading(true)
      setError('')
      setLaunchPayload(null)

      try {
        const [launchResult, resourcesResult] = await Promise.allSettled([
          loadResourceLaunch(resourceId, { force: reloadToken > 0 }),
          loadResources({ force: reloadToken > 0 }),
        ])

        if (!active) return

        if (launchResult.status !== 'fulfilled') {
          throw launchResult.reason
        }

        const launchData = launchResult.value || null
        const resource = launchData && typeof launchData === 'object' ? launchData : null

        if (!resource) {
          const notFoundError = new Error('Resource not found')
          notFoundError.name = 'ResourceNotFound'
          throw notFoundError
        }

        const resourcesPayload = resourcesResult.status === 'fulfilled' ? (resourcesResult.value || {}) : {}
        const items = Array.isArray(resourcesPayload.items) ? resourcesPayload.items : []

        setLaunchPayload(launchData)
        setAllResources(items)
      } catch (requestError) {
        if (!active) return
        if (requestError instanceof ApiClientError && requestError.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (requestError instanceof ApiClientError && requestError.status === 403) {
          setError('This resource is not available in your account.')
          return
        }
        if (requestError instanceof ApiClientError && requestError.status === 404) {
          setError('This resource content is not available right now.')
          return
        }
        setError('Unable to open this resource right now. Please try again.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadResource()
    return () => {
      active = false
    }
  }, [loadResourceLaunch, loadResources, navigate, reloadToken, resourceId])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [resourceId])

  useEffect(() => {
    const name = String(resource?.title || '').trim()
    document.title = name ? `${name} - Webstack Tool` : 'Resource Launch - Webstack Tool'
  }, [resource?.title])

  useEffect(() => {
    function updateVisibleCount() {
      const width = window.innerWidth
      if (width >= 1536) {
        setRelatedVisibleCount(5)
        return
      }
      if (width >= 1280) {
        setRelatedVisibleCount(4)
        return
      }
      if (width >= 1024) {
        setRelatedVisibleCount(3)
        return
      }
      if (width >= 640) {
        setRelatedVisibleCount(2)
        return
      }
      setRelatedVisibleCount(1)
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => {
      window.removeEventListener('resize', updateVisibleCount)
    }
  }, [])

  useEffect(() => {
    setRelatedSlideStart(0)
  }, [resourceId, searchValue])

  useEffect(() => {
    function onFrameMessage(event) {
      const iframe = iframeRef.current
      if (!iframe || event.source !== iframe.contentWindow) {
        return
      }

      if (event?.data?.type !== 'wst-launch-height') {
        const type = String(event?.data?.type || '')

        if (type === 'wst-env-request') {
          const requestId = String(event?.data?.requestId || '')
          iframe.contentWindow?.postMessage(
            {
              type: 'wst-env-response',
              requestId,
              isDesktopApp: Boolean(window.webstack && typeof window.webstack.openSite === 'function'),
            },
            '*',
          )
          return
        }

        if (type !== 'wst-open-site') {
          return
        }

        const requestId = String(event?.data?.requestId || '')
        const siteId = event?.data?.siteId
        const hasDesktopBridge = Boolean(window.webstack && typeof window.webstack.openSite === 'function')
        const hasSiteId = siteId !== null && siteId !== undefined && String(siteId).trim() !== ''

        if (!requestId) {
          return
        }

        if (!hasDesktopBridge) {
          iframe.contentWindow?.postMessage(
            {
              type: 'wst-open-site-result',
              requestId,
              ok: false,
              error: 'Desktop bridge is unavailable.',
            },
            '*',
          )
          return
        }

        if (!hasSiteId) {
          iframe.contentWindow?.postMessage(
            {
              type: 'wst-open-site-result',
              requestId,
              ok: false,
              error: 'Invalid site id.',
            },
            '*',
          )
          return
        }

        Promise.resolve(window.webstack.openSite(siteId))
          .then((result) => {
            const ok = typeof result === 'object' && result !== null
              ? Boolean(result.ok ?? result.success ?? false)
              : result !== false
            iframe.contentWindow?.postMessage(
              {
                type: 'wst-open-site-result',
                requestId,
                ok,
                error: ok ? '' : String(result?.error || 'Failed to open site.'),
              },
              '*',
            )
          })
          .catch((openSiteError) => {
            iframe.contentWindow?.postMessage(
              {
                type: 'wst-open-site-result',
                requestId,
                ok: false,
                error: String(openSiteError?.message || 'Failed to open site.'),
              },
              '*',
            )
          })
        return
      }

      const rawHeight = Number(event?.data?.height || 0)
      if (!Number.isFinite(rawHeight) || rawHeight <= 0) {
        return
      }

      const isMobile = window.innerWidth < 640
      const minHeight = isMobile ? 220 : 280
      const viewportCap = Math.floor(window.innerHeight * (isMobile ? 0.42 : 0.5))
      const hardCap = isMobile ? 380 : 520
      const maxHeight = Math.max(minHeight, Math.min(hardCap, viewportCap))
      const nextHeight = Math.max(minHeight, Math.min(maxHeight, Math.ceil(rawHeight + 16)))
      setFrameHeight(nextHeight)
    }

    window.addEventListener('message', onFrameMessage)
    return () => {
      window.removeEventListener('message', onFrameMessage)
    }
  }, [])

  useEffect(() => {
    setFrameHeight(window.innerWidth < 640 ? 240 : 360)
  }, [contentHtml])

  async function onLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  function onOpenRelatedResource(item) {
    const nextId = String(item?.resource_id || '').trim()
    if (!nextId || nextId === String(resourceId || '')) return
    navigate(`/resource-launch/${nextId}`)
  }

  const category = normalizeCategory(resource?.category_name)
  const expires = String(resource?.plan_name || '').toLowerCase() === 'free' ? 'Lifetime' : 'Active'

  const sameCategoryResources = useMemo(
    () => allResources.filter(
      (item) => String(item?.resource_id || '') !== String(resourceId || '')
        && normalizeCategory(item?.category_name) === category,
    ),
    [allResources, category, resourceId],
  )

  const filteredRelatedResources = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return sameCategoryResources
    return sameCategoryResources.filter((item) => {
      const haystack = [
        item?.title,
        item?.category_name,
        item?.plan_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [sameCategoryResources, searchValue])

  const maxRelatedStart = Math.max(0, filteredRelatedResources.length - relatedVisibleCount)
  const visibleRelatedResources = filteredRelatedResources.slice(
    relatedSlideStart,
    relatedSlideStart + relatedVisibleCount,
  )

  useEffect(() => {
    setRelatedSlideStart((current) => Math.min(current, maxRelatedStart))
  }, [maxRelatedStart])

  const detailItems = [
    { key: 'plan', label: 'Plan', value: resource?.plan_name || 'Free' },
    { key: 'category', label: 'Category', value: category },
    { key: 'expires', label: 'Expires', value: expires },
  ]

  return (
    <DashboardLayout
      activeItem="dashboard"
      onLogout={onLogout}
      onSearchChange={setSearchValue}
      searchValue={searchValue}
      user={user}
    >
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-black/25 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <p className="text-xs tracking-[0.14em] text-text-500 uppercase">Secure Workspace</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/15 px-3.5 text-sm text-text-200 transition hover:border-brand-400/60 hover:text-text-50 sm:w-auto"
                to="/dashboard"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {isLoading ? (
              <div className="shimmer h-9 w-52 rounded-xl sm:h-10 sm:w-64" />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{resource?.title || 'Protected Resource'}</h1>
            )}
            {isLoading ? (
              <div className="shimmer mt-3 h-5 w-96 max-w-full rounded-lg" />
            ) : (
              <p className="mt-3 max-w-3xl text-sm text-text-300">
                Your secure resource view is ready.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2">
                <p className="text-[11px] tracking-[0.1em] text-text-500 uppercase">Status</p>
                {isLoading ? <div className="shimmer mt-2 h-4 w-24 rounded-lg" /> : <p className="mt-1 text-sm font-semibold text-emerald-200">Validated</p>}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2">
                <p className="text-[11px] tracking-[0.1em] text-text-500 uppercase">Category</p>
                {isLoading ? <div className="shimmer mt-2 h-4 w-20 rounded-lg" /> : <p className="mt-1 text-sm font-semibold">{category}</p>}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2">
                <p className="text-[11px] tracking-[0.1em] text-text-500 uppercase">Plan</p>
                {isLoading ? <div className="shimmer mt-2 h-4 w-24 rounded-lg" /> : <p className="mt-1 text-sm font-semibold">{resource?.plan_name || 'Free'}</p>}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-sm text-rose-200">
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
          </section>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <section className="order-2 glass-panel p-4 sm:p-5 xl:order-1 xl:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Control Center</p>
              <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-text-300">Live</span>
            </div>

            <div className="grid gap-3 text-sm">
              {detailItems.map((item) => (
                <div key={item.key} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                  <p className="text-text-300">{item.label}</p>
                  {isLoading ? (
                    <div className="shimmer mt-2 h-5 w-28 rounded-lg" />
                  ) : (
                    <p className="mt-1 text-base font-semibold text-text-50">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/4 p-3">
              <p className="text-[11px] tracking-[0.1em] text-text-500 uppercase">Launch Health</p>
              <div className="mt-2 grid gap-2 text-xs text-text-300">
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Session validated
                </p>
                <p className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${contentHtml ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  {contentHtml ? 'Protected HTML loaded' : 'Protected HTML unavailable'}
                </p>
              </div>
            </div>
          </section>

          <section className="order-1 glass-panel overflow-hidden p-0 xl:order-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 bg-black/25 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/35" />
                  <span className="h-2 w-2 rounded-full bg-white/35" />
                  <span className="h-2 w-2 rounded-full bg-white/35" />
                </div>
                {isLoading ? <div className="shimmer h-5 w-52 rounded-lg" /> : <h2 className="text-lg font-semibold sm:text-xl">{resource?.title || 'Resource'} Workspace</h2>}
              </div>
              <div className="h-6" />
            </div>

            <div className="bg-[linear-gradient(160deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 sm:p-5">
              {isLoading ? (
                <div className="shimmer h-[360px] w-full rounded-2xl sm:h-[540px]" />
              ) : contentHtml ? (
                <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <iframe
                    className="block w-full"
                    onLoad={() => {
                      const iframe = iframeRef.current
                      iframe?.contentWindow?.postMessage({ type: 'wst-launch-measure' }, '*')
                    }}
                    ref={iframeRef}
                    sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    srcDoc={contentHtml}
                    style={{ height: `${frameHeight}px` }}
                    title={`${resource?.title || 'Resource'} content`}
                  />
                </article>
              ) : (
                <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-text-300">
                  No protected HTML content found for this resource.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="glass-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isLoading ? (
              <div className="shimmer h-7 w-52 rounded-lg" />
            ) : (
              <div>
                <h3 className="text-base font-semibold sm:text-xl">Resource Dock</h3>
                <p className="mt-1 text-xs text-text-500">More tools in {category}.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="shimmer h-4 w-14 rounded-lg" />
              ) : (
                <span className="text-xs text-text-500">{filteredRelatedResources.length} tool(s)</span>
              )}
              {!isLoading && filteredRelatedResources.length > relatedVisibleCount ? (
                <>
                  <button
                    aria-label="Previous tools"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-text-200 transition hover:border-brand-400/40 hover:text-text-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={relatedSlideStart <= 0}
                    onClick={() => setRelatedSlideStart((current) => Math.max(0, current - 1))}
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next tools"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-text-200 transition hover:border-brand-400/40 hover:text-text-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={relatedSlideStart >= maxRelatedStart}
                    onClick={() => setRelatedSlideStart((current) => Math.min(maxRelatedStart, current + 1))}
                    type="button"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div
            className="mt-4 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Math.min(relatedVisibleCount, isLoading ? relatedVisibleCount : visibleRelatedResources.length || 1))}, minmax(0, 1fr))`,
            }}
          >
            {isLoading
              ? Array.from({ length: relatedVisibleCount }, (_, index) => `related-skeleton-${index + 1}`).map((key) => (
                <article key={key} className="rounded-2xl border border-white/10 bg-white/3 p-4">
                  <div className="shimmer h-5 w-28 rounded-lg" />
                  <div className="shimmer mt-2 h-4 w-20 rounded-lg" />
                  <div className="shimmer mt-4 h-9 w-full rounded-xl" />
                </article>
              ))
              : visibleRelatedResources.map((item) => (
                <article
                  key={`${item.resource_type}-${item.resource_id}`}
                  className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.title || 'Resource'}</p>
                      <p className="mt-1 text-xs text-text-500">{normalizeCategory(item.category_name)}</p>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-400/80" />
                  </div>
                  <button
                    className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl bg-brand-500/15 text-xs font-semibold text-brand-300 transition hover:bg-brand-500/25"
                    onClick={() => onOpenRelatedResource(item)}
                    type="button"
                  >
                    Open {item.title || 'Resource'}
                  </button>
                </article>
              ))}
          </div>

          {!isLoading && filteredRelatedResources.length === 0 ? (
            <p className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-text-300">
              No other active tools in this category.
            </p>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ResourceLaunchPage
