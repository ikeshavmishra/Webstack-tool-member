import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { useAuth } from '../context/useAuth.js'
import {
  resendProfileDetailsUpdateOtp,
  resendProfilePasswordChangeOtp,
  startProfileDetailsUpdate,
  startProfilePasswordChange,
  verifyProfileDetailsUpdate,
  verifyProfilePasswordChange,
} from '../lib/memberApi.js'

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function isValidMobile(value) {
  const normalized = String(value || '').replace(/[^\d+]/g, '')
  return normalized.length >= 7 && normalized.length <= 16
}

function splitName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

const OTP_RESEND_COOLDOWN_SECONDS = 300

function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, refreshAuth } = useAuth()

  const [searchValue, setSearchValue] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [isProfileOtpOpen, setIsProfileOtpOpen] = useState(false)
  const [profileChallenge, setProfileChallenge] = useState(null)
  const [profileOtp, setProfileOtp] = useState('')
  const [profileOtpError, setProfileOtpError] = useState('')
  const [profileOtpSuccess, setProfileOtpSuccess] = useState('')
  const [isVerifyingProfileOtp, setIsVerifyingProfileOtp] = useState(false)
  const [isResendingProfileOtp, setIsResendingProfileOtp] = useState(false)
  const [profileResendCooldown, setProfileResendCooldown] = useState(0)

  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [passwordChallenge, setPasswordChallenge] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordOtp, setPasswordOtp] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isRequestingPasswordOtp, setIsRequestingPasswordOtp] = useState(false)
  const [isResendingPasswordOtp, setIsResendingPasswordOtp] = useState(false)
  const [isVerifyingPasswordOtp, setIsVerifyingPasswordOtp] = useState(false)
  const [passwordResendCooldown, setPasswordResendCooldown] = useState(0)

  useEffect(() => {
    document.title = 'Settings - Webstack Tool'
  }, [])

  useEffect(() => {
    const fallbackName = splitName(user?.name)
    setFirstName(String(user?.name_f || fallbackName.firstName || ''))
    setLastName(String(user?.name_l || fallbackName.lastName || ''))
    setEmail(String(user?.email || ''))
    setMobile(String(user?.mobile_number || ''))
  }, [user?.email, user?.mobile_number, user?.name, user?.name_f, user?.name_l])

  useEffect(() => {
    if (profileResendCooldown <= 0) return undefined
    const timerId = setInterval(() => {
      setProfileResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timerId)
  }, [profileResendCooldown])

  useEffect(() => {
    if (passwordResendCooldown <= 0) return undefined
    const timerId = setInterval(() => {
      setPasswordResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timerId)
  }, [passwordResendCooldown])

  async function onLogout() {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  function closeProfileOtpModal() {
    setIsProfileOtpOpen(false)
    setProfileOtp('')
    setProfileOtpError('')
    setProfileOtpSuccess('')
  }

  function closePasswordModal() {
    setIsPasswordOpen(false)
    setPasswordChallenge(null)
    setPasswordOtp('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  async function onSubmitProfile(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const nextFirstName = firstName.trim()
    const nextLastName = lastName.trim()
    const nextEmail = email.trim().toLowerCase()
    const nextMobile = mobile.trim()

    if (!nextFirstName) {
      setError('First name is required.')
      return
    }
    if (!nextLastName) {
      setError('Last name is required.')
      return
    }
    if (!isValidEmail(nextEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (nextMobile && !isValidMobile(nextMobile)) {
      setError('Enter a valid mobile number.')
      return
    }

    const unchanged = (
      nextFirstName === String(user?.name_f || '').trim()
      && nextLastName === String(user?.name_l || '').trim()
      && nextEmail === String(user?.email || '').trim().toLowerCase()
      && nextMobile === String(user?.mobile_number || '').trim()
    )
    if (unchanged) {
      setSuccess('No changes detected.')
      return
    }

    setIsSaving(true)
    try {
      const challenge = await startProfileDetailsUpdate({
        name_f: nextFirstName,
        name_l: nextLastName,
        email: nextEmail,
        mobile_number: nextMobile || null,
      })

      setProfileChallenge(challenge)
      setProfileOtp('')
      setProfileOtpError('')
      setProfileOtpSuccess(`OTP sent to ${challenge?.masked_email || 'your email'}.`)
      setIsProfileOtpOpen(true)
      setProfileResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    } catch {
      setError('Unable to start profile update right now. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function onVerifyProfileOtp(event) {
    event.preventDefault()
    setProfileOtpError('')
    setProfileOtpSuccess('')

    const challengeId = String(profileChallenge?.challenge_id || '').trim()
    const otp = profileOtp.trim()

    if (!challengeId) {
      setProfileOtpError('Profile OTP challenge is missing. Please save changes again.')
      return
    }
    if (!otp) {
      setProfileOtpError('OTP is required.')
      return
    }

    setIsVerifyingProfileOtp(true)
    try {
      await verifyProfileDetailsUpdate({ challengeId, otp })
      await refreshAuth()
      closeProfileOtpModal()
      setProfileChallenge(null)
      setSuccess('Profile updated successfully.')
    } catch {
      setProfileOtpError('Invalid or expired OTP. Please try again.')
    } finally {
      setIsVerifyingProfileOtp(false)
    }
  }

  async function onResendProfileOtp() {
    setProfileOtpError('')
    setProfileOtpSuccess('')

    const challengeId = String(profileChallenge?.challenge_id || '').trim()
    if (!challengeId) {
      setProfileOtpError('Profile OTP challenge is missing. Please save changes again.')
      return
    }
    if (profileResendCooldown > 0) {
      return
    }

    setIsResendingProfileOtp(true)
    try {
      await resendProfileDetailsUpdateOtp({ challengeId })
      setProfileOtpSuccess('A new OTP has been sent.')
      setProfileResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    } catch {
      setProfileOtpError('Unable to resend OTP right now. Please try again.')
    } finally {
      setIsResendingProfileOtp(false)
    }
  }

  async function onRequestPasswordOtp(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    const current = currentPassword.trim()
    const nextPassword = newPassword.trim()
    const nextConfirm = confirmPassword.trim()

    if (!current) {
      setPasswordError('Current password is required.')
      return
    }
    if (nextPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (nextPassword !== nextConfirm) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    setIsRequestingPasswordOtp(true)
    try {
      const challenge = await startProfilePasswordChange({
        currentPassword: current,
        newPassword: nextPassword,
        confirmPassword: nextConfirm,
      })
      setPasswordChallenge(challenge)
      setPasswordOtp('')
      setPasswordSuccess(`OTP sent to ${challenge?.masked_email || 'your email'}.`)
      setIsPasswordOpen(true)
      setPasswordResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    } catch {
      setPasswordError('Unable to send OTP right now. Please try again.')
    } finally {
      setIsRequestingPasswordOtp(false)
    }
  }

  async function onResendPasswordOtp() {
    setPasswordError('')
    setPasswordSuccess('')

    const challengeId = String(passwordChallenge?.challenge_id || '').trim()
    if (!challengeId) {
      setPasswordError('Password OTP challenge is missing. Send OTP first.')
      return
    }
    if (passwordResendCooldown > 0) {
      return
    }

    setIsResendingPasswordOtp(true)
    try {
      await resendProfilePasswordChangeOtp({ challengeId })
      setPasswordSuccess('A new OTP has been sent.')
      setPasswordResendCooldown(OTP_RESEND_COOLDOWN_SECONDS)
    } catch {
      setPasswordError('Unable to resend OTP right now. Please try again.')
    } finally {
      setIsResendingPasswordOtp(false)
    }
  }

  async function onVerifyPasswordOtp(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    const challengeId = String(passwordChallenge?.challenge_id || '').trim()
    const otp = passwordOtp.trim()

    if (!challengeId) {
      setPasswordError('Password OTP challenge is missing. Send OTP first.')
      return
    }
    if (!otp) {
      setPasswordError('OTP is required.')
      return
    }

    setIsVerifyingPasswordOtp(true)
    try {
      await verifyProfilePasswordChange({ challengeId, otp })
      setPasswordSuccess('Password changed successfully.')
      setPasswordChallenge(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordOtp('')
      setPasswordResendCooldown(0)
      setIsPasswordOpen(false)
    } catch {
      setPasswordError('Invalid or expired OTP. Please try again.')
    } finally {
      setIsVerifyingPasswordOtp(false)
    }
  }

  return (
    <DashboardLayout
      activeItem="settings"
      onLogout={onLogout}
      onSearchChange={setSearchValue}
      searchValue={searchValue}
      user={user}
    >
      <div className="grid gap-4 pb-3 lg:gap-5">
        <section className="glass-panel p-5 sm:p-6">
          <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Settings</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Account Profile</h1>
          <p className="mt-2 text-sm text-text-300">Update your member details and security preferences.</p>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-panel p-5 sm:p-6">
            <form className="grid gap-4" onSubmit={onSubmitProfile}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-text-400 uppercase" htmlFor="settings-first-name">
                    First Name
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                    id="settings-first-name"
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    type="text"
                    value={firstName}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-text-400 uppercase" htmlFor="settings-last-name">
                    Last Name
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                    id="settings-last-name"
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    type="text"
                    value={lastName}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-text-400 uppercase" htmlFor="settings-email">
                    Email
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                    id="settings-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    type="email"
                    value={email}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold tracking-[0.08em] text-text-400 uppercase" htmlFor="settings-mobile">
                    Mobile
                  </label>
                  <input
                    className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                    id="settings-mobile"
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    value={mobile}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5">
                  <p className="text-[11px] tracking-[0.08em] text-text-500 uppercase">Login</p>
                  <p className="mt-1 text-sm font-semibold">{user?.login || '-'}</p>
                </div>
              </div>

              <button
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl border border-brand-500/50 bg-brand-500/15 px-5 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Sending OTP...' : 'Save Changes'}
              </button>

              {error ? (
                <p className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
              ) : null}
              {success ? (
                <p className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</p>
              ) : null}
            </form>
          </section>

          <section className="glass-panel p-5 sm:p-6">
            <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Security</p>
            <h2 className="mt-2 text-xl font-semibold">Password Reset</h2>
            <p className="mt-2 text-sm text-text-300">Submit password details, then verify OTP in popup to finish reset.</p>

            <form className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/4 p-4" onSubmit={onRequestPasswordOtp}>
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                type="password"
                value={currentPassword}
              />
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                type="password"
                value={newPassword}
              />
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                type="password"
                value={confirmPassword}
              />
              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-brand-500/45 bg-brand-500/15 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isRequestingPasswordOtp}
                type="submit"
              >
                {isRequestingPasswordOtp ? 'Sending OTP...' : 'Send OTP'}
              </button>
              {passwordError ? (
                <p className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{passwordError}</p>
              ) : null}
              {passwordSuccess ? (
                <p className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{passwordSuccess}</p>
              ) : null}
            </form>
          </section>
        </div>
      </div>

      {isProfileOtpOpen ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Profile Update</p>
                <h3 className="mt-1 text-xl font-semibold">Verify OTP</h3>
                <p className="mt-2 text-sm text-text-300">Enter OTP to apply profile changes.</p>
              </div>
              <button
                aria-label="Close profile OTP modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-text-300 transition hover:text-text-50"
                onClick={closeProfileOtpModal}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-300">
              OTP email: <span className="font-medium text-text-100">{profileChallenge?.masked_email || user?.email || '-'}</span>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={onVerifyProfileOtp}>
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setProfileOtp(event.target.value)}
                placeholder="Enter OTP"
                type="text"
                value={profileOtp}
              />
              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-brand-500/45 bg-brand-500/15 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isVerifyingProfileOtp}
                type="submit"
              >
                {isVerifyingProfileOtp ? 'Verifying...' : 'Verify OTP & Save'}
              </button>
              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-white/6 text-sm font-semibold text-text-100 transition hover:border-brand-500/45 hover:bg-brand-500/12 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isResendingProfileOtp || profileResendCooldown > 0}
                onClick={onResendProfileOtp}
                type="button"
              >
                {isResendingProfileOtp ? 'Resending...' : (profileResendCooldown > 0 ? `Resend OTP in ${formatCountdown(profileResendCooldown)}` : 'Resend OTP')}
              </button>
            </form>

            {profileOtpError ? (
              <p className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{profileOtpError}</p>
            ) : null}
            {profileOtpSuccess ? (
              <p className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{profileOtpSuccess}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isPasswordOpen ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.1em] text-text-500 uppercase">Password Reset</p>
                <h3 className="mt-1 text-xl font-semibold">Verify OTP</h3>
                <p className="mt-2 text-sm text-text-300">Enter OTP to apply password reset.</p>
              </div>
              <button
                aria-label="Close reset modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-text-300 transition hover:text-text-50"
                onClick={closePasswordModal}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-text-300">
              OTP email: <span className="font-medium text-text-100">{passwordChallenge?.masked_email || user?.email || '-'}</span>
            </div>

            <form className="mt-4 grid gap-3" onSubmit={onVerifyPasswordOtp}>
              <input
                className="h-12 rounded-xl border border-white/12 bg-black/25 px-3.5 text-sm text-text-50 outline-none transition placeholder:text-text-500 focus:border-brand-500/55 focus:ring-4 focus:ring-brand-500/20"
                onChange={(event) => setPasswordOtp(event.target.value)}
                placeholder="Enter OTP"
                type="text"
                value={passwordOtp}
              />

              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-brand-500/45 bg-brand-500/15 text-sm font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isVerifyingPasswordOtp}
                type="submit"
              >
                {isVerifyingPasswordOtp ? 'Verifying...' : 'Verify OTP & Reset'}
              </button>
              <button
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-white/6 text-sm font-semibold text-text-100 transition hover:border-brand-500/45 hover:bg-brand-500/12 disabled:cursor-not-allowed disabled:opacity-65"
                disabled={isResendingPasswordOtp || passwordResendCooldown > 0}
                onClick={onResendPasswordOtp}
                type="button"
              >
                {isResendingPasswordOtp ? 'Resending...' : (passwordResendCooldown > 0 ? `Resend OTP in ${formatCountdown(passwordResendCooldown)}` : 'Resend OTP')}
              </button>
            </form>

            {passwordError ? (
              <p className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{passwordError}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{passwordSuccess}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}

export default SettingsPage
