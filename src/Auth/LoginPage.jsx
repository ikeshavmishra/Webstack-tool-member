import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell.jsx'
import TextField from '../components/TextField.jsx'
import { useAuth } from '../context/useAuth.js'

function LoginPage() {
  const OTP_RESEND_COOLDOWN_SECONDS = 300
  const navigate = useNavigate()
  const { loginChallenge, resendLoginFlowOtp, startLoginFlow, verifyLoginFlow } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = setInterval(() => {
      setResendCooldown((previous) => (previous <= 1 ? 0 : previous - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  function formatCooldown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  async function onStartLogin(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const challenge = await startLoginFlow({
        identifier: identifier.trim(),
        password,
      })
      setMessage(`OTP sent to ${challenge?.masked_email || 'your email'}.`)
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
      setIsOtpModalOpen(true)
    } catch {
      setError('Unable to send OTP right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onSubmitOtp(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!otp.trim()) {
      setError('OTP is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyLoginFlow({
        challengeId: String(loginChallenge?.challenge_id || '').trim(),
        otp: otp.trim(),
      })
      setIsOtpModalOpen(false)
      setOtp('')
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid or expired OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onResendOtp() {
    if (resendCooldown > 0) return
    setError('')
    setMessage('')
    setIsResending(true)
    try {
      await resendLoginFlowOtp({
        challengeId: String(loginChallenge?.challenge_id || '').trim(),
      })
      setMessage('A new OTP has been sent.')
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    } catch {
      setError('Unable to resend OTP right now. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Member Login"
      title="Sign In"
      description="Sign in with your password and complete OTP verification."
      switchLabel="New member?"
      switchCta="Create account"
      switchTo="/signup"
    >
      <form className="grid gap-4" onSubmit={onStartLogin}>
        <TextField
          id="login-identifier"
          name="identifier"
          label="Email or Username"
          placeholder="you@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <TextField
          id="login-password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          className={`mt-2 inline-flex h-12 items-center justify-center rounded-full border border-brand-500/55 bg-gradient-to-r from-brand-500 to-brand-400 px-5 text-sm font-bold text-bg-950 disabled:cursor-not-allowed disabled:opacity-65 ${isSubmitting ? 'shimmer' : ''}`}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
        </button>

        <p className="text-right text-sm text-text-300">
          <Link className="font-semibold text-brand-300 transition hover:text-brand-400" to="/forgot-password">
            Forgot password?
          </Link>
        </p>

        {error ? (
          <p className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{message}</p>
        ) : null}
      </form>

      {isOtpModalOpen ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.1em] text-text-500 uppercase">OTP Verification</p>
                <h3 className="mt-1 text-xl font-semibold">Login OTP</h3>
                <p className="mt-2 text-sm text-text-300">Enter the OTP sent to your email.</p>
              </div>
              <button
                aria-label="Close OTP modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-text-300 transition hover:text-text-50"
                onClick={() => setIsOtpModalOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={onSubmitOtp}>
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                type="text"
                value={otp}
              />
              <button
                className={`inline-flex h-11 w-full items-center justify-center rounded-xl border border-brand-500/45 bg-brand-500/15 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-65 ${isSubmitting ? 'shimmer' : ''}`}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                className={`inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-white/6 text-sm font-semibold text-text-100 transition hover:border-brand-500/45 hover:bg-brand-500/12 disabled:cursor-not-allowed disabled:opacity-65 ${isResending ? 'shimmer' : ''}`}
                disabled={isResending || resendCooldown > 0}
                onClick={onResendOtp}
                type="button"
              >
                {isResending ? 'Resending...' : resendCooldown > 0 ? `Resend OTP in ${formatCooldown(resendCooldown)}` : 'Resend OTP'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AuthShell>
  )
}

export default LoginPage
