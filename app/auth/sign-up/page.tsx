'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const router = useRouter(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const { data, error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`, data: { full_name: name, role: 'doctor' } } }); if (error) setError(error.message.includes('password') ? 'Choose a stronger password.' : 'Unable to create this account.'); else if (data.session) router.push('/dashboard'); else router.push('/auth/sign-up-success'); setLoading(false) }
  return <main className="auth-page"><Link className="auth-brand" href="/">setu</Link><section className="auth-card"><div className="eyebrow">PRIVATE WORKSPACE</div><h1>Create your account</h1><p>Start a secure place for the records your care team depends on.</p><form onSubmit={submit}><label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label><label>Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary-button full" disabled={loading}>{loading ? 'Creating…' : 'Create workspace'}</button></form><div className="auth-footer">Already have an account? <Link href="/auth/login">Sign in</Link></div></section></main>
}
