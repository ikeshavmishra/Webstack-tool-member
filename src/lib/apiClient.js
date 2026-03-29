import { getAuthToken } from './authToken.js'

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = String(path || '').trim().replace(/^\/+/, '')
  if (!normalizedPath) return API_BASE_URL || '/'

  if (API_BASE_URL) {
    return `${API_BASE_URL}/${normalizedPath}`
  }

  return `/${normalizedPath}`
}

function parsePayload(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function readErrorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload.error === 'string' && payload.error) return payload.error
  if (typeof payload.message === 'string' && payload.message) return payload.message
  return fallback
}

export class ApiClientError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.payload = payload
  }
}

export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const requestUrl = resolveApiUrl(path)
  const requestHeaders = { ...(headers || {}) }

  if (body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const token = getAuthToken()
  if (token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(requestUrl, {
      method,
      credentials: 'include',
      headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new ApiClientError(
      `Network request failed for ${method} ${requestUrl}. Check API URL and CORS.`,
      0,
      { cause: String(error?.message || error) },
    )
  }

  const text = await response.text()
  const payload = parsePayload(text)

  if (!response.ok) {
    throw new ApiClientError(
      readErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    )
  }

  return payload
}
