'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const { error } = await createClient().auth.signInWithPassword({ email, password }); if (error) setError(error.message.includes('confirm') ? 'Please confirm your email before signing in.' : 'Invalid email or password.'); else router.push('/dashboard'); setLoading(false) }
  return <main className="auth-page"><Link className="auth-brand" href="/">setu</Link><section className="auth-card"><div className="eyebrow">WELCOME BACK</div><h1>Sign in to Setu</h1><p>Return to the patient context that keeps care connected.</p><form onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form><div className="auth-footer">New to Setu? <Link href="/auth/sign-up">Create an account</Link></div></section></main>
}
