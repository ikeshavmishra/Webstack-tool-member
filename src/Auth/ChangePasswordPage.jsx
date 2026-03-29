import AuthShell from '../components/AuthShell.jsx'

function ChangePasswordPage() {
  return (
    <AuthShell
      eyebrow="Change Password"
      title="Change Password"
      description="Update your password securely."
      switchLabel="Need login first?"
      switchCta="Go to login"
      switchTo="/login"
    >
      <p className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-text-300">
        This page is being prepared. For now, use the Forgot Password flow from the login page.
      </p>
    </AuthShell>
  )
}

export default ChangePasswordPage
