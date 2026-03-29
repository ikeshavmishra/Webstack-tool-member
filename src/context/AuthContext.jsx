import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '../lib/apiClient.js'
import {
  fetchDashboard,
  fetchMe,
  fetchResources,
  logout as apiLogout,
  resendForgotPasswordOtp,
  resendLoginOtp,
  resendSignupOtp,
  startForgotPassword,
  startLogin,
  startSignup,
  verifyForgotPassword,
  verifyLogin,
  verifySignup,
} from '../lib/memberApi.js'

const AuthContext = createContext(null)

function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null

  const nameF = String(raw.name_f || '').trim()
  const nameL = String(raw.name_l || '').trim()
  const displayName = String(raw.display_name || '').trim()
  const fullName = displayName || [nameF, nameL].filter(Boolean).join(' ').trim() || String(raw.login || 'Member')

  return {
    id: Number(raw.id || raw.user_id || 0) || 0,
    login: String(raw.login || ''),
    email: String(raw.email || ''),
    name_f: nameF,
    name_l: nameL,
    name: fullName,
    mobile_number: raw.mobile_number || null,
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [loginChallenge, setLoginChallenge] = useState(null)
  const [signupChallenge, setSignupChallenge] = useState(null)
  const [forgotChallenge, setForgotChallenge] = useState(null)

  const refreshAuth = useCallback(async () => {
    try {
      const profile = await fetchMe()
      const normalized = normalizeUser(profile)
      setUser(normalized)
      return normalized
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setUser(null)
        return null
      }
      throw error
    }
  }, [])

  useEffect(() => {
    let active = true

    async function hydrateAuth() {
      try {
        await refreshAuth()
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    hydrateAuth()

    return () => {
      active = false
    }
  }, [refreshAuth])

  const startLoginFlow = useCallback(async ({ identifier, password }) => {
    const challenge = await startLogin({ identifier, password })
    setLoginChallenge(challenge)
    return challenge
  }, [])

  const verifyLoginFlow = useCallback(async ({ otp, challengeId } = {}) => {
    const finalChallengeId = String(challengeId || loginChallenge?.challenge_id || '').trim()
    const data = await verifyLogin({ challengeId: finalChallengeId, otp })
    setLoginChallenge(null)

    const profile = await refreshAuth()
    if (profile) return profile

    const fallback = normalizeUser(data?.user)
    setUser(fallback)
    return fallback
  }, [loginChallenge?.challenge_id, refreshAuth])

  const resendLoginFlowOtp = useCallback(async ({ challengeId } = {}) => {
    const finalChallengeId = String(challengeId || loginChallenge?.challenge_id || '').trim()
    const challenge = await resendLoginOtp({ challengeId: finalChallengeId })
    setLoginChallenge((prev) => ({ ...(prev || {}), ...(challenge || {}) }))
    return challenge
  }, [loginChallenge?.challenge_id])

  const startSignupFlow = useCallback(async (payload) => {
    const challenge = await startSignup(payload)
    setSignupChallenge(challenge)
    return challenge
  }, [])

  const verifySignupFlow = useCallback(async ({ otp, challengeId } = {}) => {
    const finalChallengeId = String(challengeId || signupChallenge?.challenge_id || '').trim()
    const data = await verifySignup({ challengeId: finalChallengeId, otp })
    setSignupChallenge(null)

    const profile = await refreshAuth()
    if (profile) return profile

    const fallback = normalizeUser(data?.user)
    setUser(fallback)
    return fallback
  }, [refreshAuth, signupChallenge?.challenge_id])

  const resendSignupFlowOtp = useCallback(async ({ challengeId } = {}) => {
    const finalChallengeId = String(challengeId || signupChallenge?.challenge_id || '').trim()
    const challenge = await resendSignupOtp({ challengeId: finalChallengeId })
    setSignupChallenge((prev) => ({ ...(prev || {}), ...(challenge || {}) }))
    return challenge
  }, [signupChallenge?.challenge_id])

  const startForgotPasswordFlow = useCallback(async ({ identifier }) => {
    const challenge = await startForgotPassword({ identifier })
    setForgotChallenge(challenge)
    return challenge
  }, [])

  const verifyForgotPasswordFlow = useCallback(async ({ otp, newPassword, confirmPassword, challengeId } = {}) => {
    const finalChallengeId = String(challengeId || forgotChallenge?.challenge_id || '').trim()
    const payload = await verifyForgotPassword({
      challengeId: finalChallengeId,
      otp,
      newPassword,
      confirmPassword,
    })
    setForgotChallenge(null)
    return payload
  }, [forgotChallenge?.challenge_id])

  const resendForgotPasswordFlowOtp = useCallback(async ({ challengeId } = {}) => {
    const finalChallengeId = String(challengeId || forgotChallenge?.challenge_id || '').trim()
    const challenge = await resendForgotPasswordOtp({ challengeId: finalChallengeId })
    setForgotChallenge((prev) => ({ ...(prev || {}), ...(challenge || {}) }))
    return challenge
  }, [forgotChallenge?.challenge_id])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setLoginChallenge(null)
      setSignupChallenge(null)
      setForgotChallenge(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshAuth,
      fetchDashboard,
      fetchResources,
      loginChallenge,
      signupChallenge,
      forgotChallenge,
      startLoginFlow,
      verifyLoginFlow,
      resendLoginFlowOtp,
      startSignupFlow,
      verifySignupFlow,
      resendSignupFlowOtp,
      startForgotPasswordFlow,
      verifyForgotPasswordFlow,
      resendForgotPasswordFlowOtp,
      logout,
    }),
    [
      user,
      isLoading,
      refreshAuth,
      loginChallenge,
      signupChallenge,
      forgotChallenge,
      fetchResources,
      startLoginFlow,
      verifyLoginFlow,
      resendLoginFlowOtp,
      startSignupFlow,
      verifySignupFlow,
      resendSignupFlowOtp,
      startForgotPasswordFlow,
      verifyForgotPasswordFlow,
      resendForgotPasswordFlowOtp,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
