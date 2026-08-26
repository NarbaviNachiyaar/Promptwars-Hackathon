'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Activity, AlertTriangle, ArrowUpRight, CalendarDays, ChevronDown, Clock3,
  FileText, HeartPulse, LayoutDashboard, Menu, Plus, Search, ShieldCheck,
  Sparkles, Stethoscope, Upload, UserRound, Users, X, Zap,
} from 'lucide-react'

type Document = { id: string; document_date: string; facility: string; title: string; document_type: string; raw_text: string }
const sampleDocuments: Document[] = [
  { id: 'sample-1', document_date: '2026-08-24', facility: 'Jehangir Hospital', title: 'Outpatient follow-up', document_type: 'OUTPATIENT', raw_text: 'Persistent fatigue · Creatinine 1.8 mg/dL' },
  { id: 'sample-2', document_date: '2026-08-20', facility: 'Sahyadri Hospital', title: 'Discharge summary', document_type: 'DISCHARGE', raw_text: 'Complicated urinary infection · Repeat renal panel advised' },
  { id: 'sample-3', document_date: '2026-08-18', facility: 'Ruby Hall Clinic', title: 'Emergency department note', document_type: 'ED NOTE', raw_text: 'Fever and dysuria · Creatinine 1.4 mg/dL' },
  { id: 'sample-4', document_date: '2026-03-04', facility: 'Jehangir Hospital', title: 'Annual health review', document_type: 'OUTPATIENT', raw_text: 'Baseline metabolic panel documented' },
  { id: 'sample-5', document_date: '2025-11-14', facility: 'Sahyadri Hospital', title: 'Primary care note', document_type: 'OUTPATIENT', raw_text: 'No known drug allergies recorded' },
]
function formatDate(value: string) { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) }
function toneFor(type: string) { return type === 'DISCHARGE' ? 'amber' : type === 'OUTPATIENT' || type === 'ED NOTE' ? 'teal' : 'slate' }

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function TrendChart() {
  return (
    <div className="trend-chart" aria-label="Creatinine trend from 1.4 to 1.8 milligrams per decilitre">
      <div className="chart-y"><span>2.0</span><span>1.8</span><span>1.6</span><span>1.4</span><span>1.2</span></div>
      <svg viewBox="0 0 420 130" role="img" aria-hidden="true" preserveAspectRatio="none">
        <path d="M10 106 C70 101 103 82 175 75 S280 51 405 18" fill="none" stroke="var(--teal)" strokeWidth="3" />
        <path d="M10 106 C70 101 103 82 175 75 S280 51 405 18 L405 130 L10 130Z" fill="var(--teal-soft)" />
        {[['10','106'],['190','70'],['405','18']].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="5" fill="var(--paper)" stroke="var(--teal)" strokeWidth="3" />)}
      </svg>
      <div className="chart-x"><span>18 Aug</span><span>20 Aug</span><span>24 Aug</span></div>
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState('Doctor')
  const [mobileNav, setMobileNav] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [reconstructing, setReconstructing] = useState(false)
  const [query, setQuery] = useState('')
  const [uploadName, setUploadName] = useState('')
  const supabase = typeof window === 'undefined' ? null : createClient()
  const { data: patient } = useSWR('setu-patient', async () => {
    if (!supabase) return null
    const { data } = await supabase.from('patients').select('id,name,age,location,summary').order('created_at', { ascending: true }).limit(1).maybeSingle()
    return data ?? { id: '11111111-1111-4111-8111-111111111111', name: 'Meera Iyer', age: 42, location: 'Pune, Maharashtra', summary: 'Continuity record across 3 care settings.' }
  }, { revalidateOnFocus: false })
  const { data: liveDocuments, mutate } = useSWR(patient?.id ? `setu-documents-${patient.id}` : null, async () => {
    const { data } = await supabase.from('documents').select('id,document_date,facility,title,document_type,raw_text').eq('patient_id', patient.id).order('document_date', { ascending: false })
    return data?.length ? data : sampleDocuments
  }, { revalidateOnFocus: false })
  const documents = liveDocuments ?? sampleDocuments
  const filtered = useMemo(() => documents.filter((d) => `${d.title} ${d.facility} ${d.raw_text}`.toLowerCase().includes(query.toLowerCase())), [documents, query])

  function reconstruct() {
    setReconstructing(true)
    setTimeout(() => setReconstructing(false), 1300)
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><span /></div><span>setu</span></div>
        <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button className="nav-item active"><LayoutDashboard size={17} /> Overview</button>
          <button className="nav-item"><Users size={17} /> Patients <span className="nav-count">1</span></button>
          <button className="nav-item"><FileText size={17} /> Documents</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={16} /><div><strong>Private workspace</strong><span>Supabase secured</span></div></div>
          <div className="profile"><div className="avatar">AK</div><div><strong>Dr. Ananya Kulkarni</strong><span>Cardiology · Pune</span></div><ChevronDown size={15} /></div>
        </div>
      </aside>
      <section className="content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div className="crumb">Patients <span>/</span> <strong>Meera Iyer</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search"><Search size={18} /></button><div className="live-dot"><i /> Secure session</div></div></header>
        <div className="page-wrap">
          <div className="patient-head"><div><div className="eyebrow">PATIENT OVERVIEW <span>•</span> LAST UPDATED 24 AUG 2026</div><h1>Meera Iyer <span>42</span></h1><p className="subhead">Pune, Maharashtra <span>·</span> Continuity record across 3 care settings</p></div><div className="view-toggle" role="tablist" aria-label="Patient view"><span>VIEW AS</span>{['Doctor', 'Timeline', 'Patient'].map((item) => <button key={item} onClick={() => setView(item)} className={view === item ? 'selected' : ''} role="tab" aria-selected={view === item}>{item}</button>)}</div></div>
          <div className="notice"><div className="notice-icon"><AlertTriangle size={19} /></div><div><strong>2 items need attention</strong><span>Setu found a medication-history conflict and an unconfirmed follow-up in the supplied records.</span></div><button onClick={() => document.getElementById('patterns')?.scrollIntoView({ behavior: 'smooth' })}>Review flags <ArrowUpRight size={15} /></button></div>
          <div className="section-heading"><div><h2>{view === 'Timeline' ? 'Care timeline' : view === 'Patient' ? 'Your health record' : 'Clinical snapshot'}</h2><p>{view === 'Patient' ? 'A clear view of what your records say, in plain language.' : 'A cross-record view, grounded in the documents you provide.'}</p></div><button className="primary-button" onClick={reconstruct} disabled={reconstructing}><Sparkles size={16} /> {reconstructing ? 'Reconstructing…' : 'Reconstruct history'}</button></div>
          {view === 'Timeline' ? <div className="timeline-panel">{documents.map((doc, i) => <div className="timeline-row" key={doc.title}><div className="timeline-date">{formatDate(doc.document_date)}</div><div className={`timeline-node ${toneFor(doc.document_type)}`}><span /></div><div className="timeline-card"><div><Badge tone={toneFor(doc.document_type)}>{doc.document_type}</Badge><h3>{doc.title}</h3><p>{doc.facility} · {doc.raw_text}</p></div><FileText size={18} /></div></div>)}</div> : <>
            <div className="metric-grid"><div className="metric-card"><div className="metric-label">RECORDS RECONCILED <FileText size={15} /></div><strong>5</strong><span>Across 3 hospitals</span></div><div className="metric-card"><div className="metric-label">OPEN PATTERNS <AlertTriangle size={15} /></div><strong className="amber-text">2</strong><span>1 high attention</span></div><div className="metric-card"><div className="metric-label">LATEST ACTIVITY <Clock3 size={15} /></div><strong>24 <small>AUG</small></strong><span>Jehangir Hospital</span></div><div className="metric-card trend-metric"><div className="metric-label">CREATININE TREND <Activity size={15} /></div><strong>1.8 <small>mg/dL</small></strong><span className="up"><ArrowUpRight size={14} /> +0.4 since 18 Aug</span></div></div>
            <div className="main-grid"><section className="panel" id="patterns"><div className="panel-head"><div><div className="panel-kicker amber-kicker"><Zap size={14} /> REQUIRES REVIEW</div><h2>Patterns detected</h2></div><span className="ai-label"><Sparkles size={13} /> AI-flagged</span></div><div className="pattern high"><div className="pattern-bar" /><div className="pattern-body"><div className="pattern-title"><h3>Allergy list conflict</h3><Badge tone="amber">HIGH ATTENTION</Badge></div><p>One discharge summary lists a penicillin rash; two other records state no known drug allergies.</p><div className="source-row"><FileText size={14} /> 3 source documents <ArrowUpRight size={13} /></div></div></div><div className="pattern"><div className="pattern-bar" /><div className="pattern-body"><div className="pattern-title"><h3>Repeat renal panel not found</h3><Badge tone="amber">FOLLOW-UP</Badge></div><p>A 48-hour repeat panel was advised, but no matching result appears in the supplied documents.</p><div className="source-row"><FileText size={14} /> 2 source documents <ArrowUpRight size={13} /></div></div></div></section><section className="panel trend-panel"><div className="panel-head"><div><div className="panel-kicker teal-kicker"><Activity size={14} /> EXTRACTED FACT</div><h2>Lab trend</h2></div><span className="source-label">3 records</span></div><div className="trend-title"><div><strong>Creatinine</strong><span>mg/dL · serum</span></div><div className="trend-reading">1.8 <span>latest</span></div></div><TrendChart /><div className="trend-foot"><span><i className="legend-fact" /> Documented value</span><span>Trend is descriptive, not diagnostic.</span></div></section></div>
          </>}
          <section className="documents-section"><div className="section-heading compact"><div><h2>Source documents</h2><p>Every insight stays linked to its original record.</p></div><div className="doc-actions"><div className="search-field"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records" aria-label="Search records" /></div><button className="secondary-button" onClick={() => setShowUpload(true)}><Plus size={16} /> Add document</button></div></div><div className="document-list">{filtered.map((doc) => <div className="document-row" key={doc.title}><div className={`doc-icon ${toneFor(doc.document_type)}`}><FileText size={18} /></div><div className="doc-info"><strong>{doc.title}</strong><span>{doc.facility} <i>·</i> {formatDate(doc.document_date)}</span></div><Badge tone={toneFor(doc.document_type)}>{doc.document_type}</Badge><span className="doc-detail">{doc.raw_text}</span><ArrowUpRight className="row-arrow" size={16} /></div>)}</div></section>
          <footer><span><HeartPulse size={15} /> Setu keeps context moving with the patient.</span><span>For clinical review only · Not medical advice</span></footer>
        </div>
      </section>
      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="upload-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowUpload(false)} aria-label="Close"><X size={17} /></button><div className="upload-mark"><Upload size={21} /></div><h2>Add a source document</h2><p>Upload a PDF or paste a clinical note. Setu will keep the original source linked to every extracted insight.</p><button className="dropzone"><Upload size={22} /><strong>Drop a file here</strong><span>PDF, TXT up to 10MB</span></button><button className="primary-button full" onClick={() => setShowUpload(false)}>Continue</button></div></div>}
    </main>
  )
}
