import { apiRequest } from './apiClient.js'
import { clearAuthToken, setAuthToken } from './authToken.js'

function unwrap(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

export async function fetchMe() {
  return unwrap(await apiRequest('me'))
}

export async function startLogin({ identifier, password }) {
  return unwrap(
    await apiRequest('auth/login/start', {
      method: 'POST',
      body: { identifier, password },
    }),
  )
}

export async function verifyLogin({ challengeId, otp }) {
  const data = unwrap(
    await apiRequest('auth/login/verify', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
        otp,
      },
    }),
  )

  if (data?.access_token) {
    setAuthToken(data.access_token)
  }

  return data
}

export async function resendLoginOtp({ challengeId }) {
  return unwrap(
    await apiRequest('auth/login/resend', {
      method: 'POST',
      body: { challenge_id: challengeId },
    }),
  )
}

export async function startSignup(payload) {
  return unwrap(
    await apiRequest('auth/signup/start', {
      method: 'POST',
      body: payload,
    }),
  )
}

export async function verifySignup({ challengeId, otp }) {
  const data = unwrap(
    await apiRequest('auth/signup/verify', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
        otp,
      },
    }),
  )

  if (data?.access_token) {
    setAuthToken(data.access_token)
  }

  return data
}

export async function resendSignupOtp({ challengeId }) {
  return unwrap(
    await apiRequest('auth/signup/resend', {
      method: 'POST',
      body: { challenge_id: challengeId },
    }),
  )
}

export async function startForgotPassword({ identifier }) {
  return unwrap(
    await apiRequest('auth/forgot-password/start', {
      method: 'POST',
      body: { identifier },
    }),
  )
}

export async function verifyForgotPassword({ challengeId, otp, newPassword, confirmPassword }) {
  return unwrap(
    await apiRequest('auth/forgot-password/verify', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
    }),
  )
}

export async function resendForgotPasswordOtp({ challengeId }) {
  return unwrap(
    await apiRequest('auth/forgot-password/resend', {
      method: 'POST',
      body: { challenge_id: challengeId },
    }),
  )
}

export async function logout() {
  try {
    await apiRequest('auth/logout', { method: 'POST' })
  } finally {
    clearAuthToken()
  }
}

export async function fetchDashboard() {
  return unwrap(await apiRequest('dashboard'))
}

export async function fetchResources() {
  return unwrap(await apiRequest('resources'))
}

export async function fetchResourceLaunch(resourceId) {
  const normalizedResourceId = String(resourceId || '').trim()
  return unwrap(await apiRequest(`resources/launch/${encodeURIComponent(normalizedResourceId)}`))
}

export async function fetchSubscriptions() {
  return unwrap(await apiRequest('subscriptions'))
}

function toQueryString(params) {
  const entries = Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()}`
}

export async function fetchPayments({ page = 1, perPage = 20, status = 'all' } = {}) {
  const query = toQueryString({
    page,
    per_page: perPage,
    status,
  })
  return unwrap(await apiRequest(`payments${query}`))
}

export async function fetchInvoiceAccess({ page = 1, perPage = 20, status = 'all' } = {}) {
  const query = toQueryString({
    page,
    per_page: perPage,
    status,
  })
  return unwrap(await apiRequest(`invoice/access${query}`))
}

export async function startProfileDetailsUpdate(payload) {
  return unwrap(
    await apiRequest('profile/details/start', {
      method: 'POST',
      body: payload,
    }),
  )
}

export async function verifyProfileDetailsUpdate({ challengeId, otp }) {
  return unwrap(
    await apiRequest('profile/details/verify', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
        otp,
      },
    }),
  )
}

export async function resendProfileDetailsUpdateOtp({ challengeId }) {
  return unwrap(
    await apiRequest('profile/details/resend', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
      },
    }),
  )
}

export async function startProfilePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  return unwrap(
    await apiRequest('profile/password/start', {
      method: 'POST',
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
    }),
  )
}

export async function verifyProfilePasswordChange({ challengeId, otp }) {
  return unwrap(
    await apiRequest('profile/password/verify', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
        otp,
      },
    }),
  )
}

export async function resendProfilePasswordChangeOtp({ challengeId }) {
  return unwrap(
    await apiRequest('profile/password/resend', {
      method: 'POST',
      body: {
        challenge_id: challengeId,
      },
    }),
  )
}
