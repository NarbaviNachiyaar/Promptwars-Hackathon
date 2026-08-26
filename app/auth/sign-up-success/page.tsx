import Link from 'next/link'

export default function SignUpSuccessPage() {
  return <main className="auth-page"><Link className="auth-brand" href="/">setu</Link><section className="auth-card"><div className="eyebrow">CHECK YOUR INBOX</div><h1>Confirm your email</h1><p>We sent a confirmation link to your email address. After confirming, return here to sign in.</p><Link className="primary-button full button-link" href="/auth/login">Go to sign in</Link></section></main>
}
