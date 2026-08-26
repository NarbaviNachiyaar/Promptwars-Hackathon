'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import { CheckCircle2, FileUp, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'doctor' | 'patient'

export function VerificationForm({ initialRole = 'doctor' }: { initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) { setError('Choose your identity document first.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Please choose a file smaller than 5 MB.'); return }
    setStatus('saving'); setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Your session has expired. Please sign in again.'); setStatus('idle'); return }
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('verification-documents').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })
    if (uploadError) { setError('We could not upload that document. Please try again.'); setStatus('idle'); return }
    const { error: profileError } = await supabase.from('profiles').update({ verification_status: 'submitted', id_document_path: path, id_document_type: role === 'doctor' ? 'doctor_license' : 'aadhaar' }).eq('id', user.id)
    if (profileError) { setError('The document uploaded, but the verification record could not be saved.'); setStatus('idle'); return }
    setStatus('done')
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setError('') }

  return <form className="verification-form" onSubmit={submit}>
    <div className="verification-header"><div className="settings-icon"><ShieldCheck size={20} /></div><div><h2>Identity verification</h2><p>Setu uses this to keep clinical records in the right hands.</p></div></div>
    <label className="verification-label">I am joining as<select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="doctor">Doctor</option><option value="patient">Patient</option></select></label>
    <div className="verification-help">{role === 'doctor' ? 'Upload a medical license or doctor ID card.' : 'Upload your Aadhaar card or another patient identity document.'}</div>
    <label className="file-picker"><FileUp size={19} /><span>{file ? file.name : 'Choose ID document'}</span><input type="file" accept="image/png,image/jpeg,application/pdf" onChange={onFileChange} /></label>
    <p className="verification-note">Accepted: PDF, JPG, or PNG · Maximum 5 MB · Stored privately in Supabase Storage.</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    {status === 'done' ? <div className="verification-success" role="status"><CheckCircle2 size={18} /> Verification document submitted for review.</div> : <button className="primary-button" disabled={status === 'saving'}>{status === 'saving' ? <><Loader2 size={16} className="spin" /> Uploading…</> : 'Submit for verification'}</button>}
  </form>
}
