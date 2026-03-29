const TOKEN_KEY = 'wst_member_access_token'

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getAuthToken() {
  if (!hasStorage()) return ''
  return String(window.localStorage.getItem(TOKEN_KEY) || '').trim()
}

export function setAuthToken(token) {
  if (!hasStorage()) return
  const value = String(token || '').trim()
  if (!value) {
    window.localStorage.removeItem(TOKEN_KEY)
    return
  }
  window.localStorage.setItem(TOKEN_KEY, value)
}

export function clearAuthToken() {
  if (!hasStorage()) return
  window.localStorage.removeItem(TOKEN_KEY)
}
