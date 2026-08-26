# Setu

**AI-powered continuity of care for Indian healthcare.**

Patients move between hospitals and their clinical context stays behind. Setu reconciles a
patient's records across hospitals, reconstructs one cited timeline, and flags contradictions,
missing follow-ups and trends — then presents the same data through a doctor view, a timeline
view and a plain-language patient view.

---

## Stack

| Layer | What this project uses |
| --- | --- |
| Frontend | React 19 + TanStack Start (file-based routing, SSR) + Tailwind CSS v4 |
| Backend / DB | Supabase — managed Postgres, Auth and Storage |
| Server logic | TanStack `createServerFn` (the equivalent of a Next.js API route) — never the client |
| LLM | Anthropic API (`claude-sonnet-4-6`), key held server-side only |
| Deploy | Vercel, deployed from a GitHub repo |

The LLM call lives in a server-only function (`src/lib/setu.functions.ts`) and the Anthropic key
is never shipped to the browser.

---

## Deploying: GitHub → Vercel, with Supabase as the database

GitHub is the bridge: Vercel builds and deploys straight from a GitHub repo, and that same repo
is where you keep your Supabase migrations (`supabase/migrations/`) so schema changes are
versioned alongside the app.

1. **Create the Supabase project** (if you don't already have one) at
   [supabase.com](https://supabase.com/dashboard). Note the project's URL and keys from
   Project Settings → API.
2. **Apply the schema** to that project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   This runs everything in `supabase/migrations/`, creating the tables, RLS policies and demo
   seed data described below.
3. **Push this repo to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
4. **Import the repo in Vercel**: [vercel.com/new](https://vercel.com/new) → select the GitHub
   repo → Vercel auto-detects the build via `vercel.json` (`npm run build`, output
   `dist/client`, everything else served by the Edge Function in `api/index.ts`).
5. **Set environment variables** in the Vercel project (Settings → Environment Variables) —
   see the table below. Use the same values as your `.env` file.
6. **Deploy.** Every push to `main` now redeploys automatically; every pull request gets its own
   preview deployment, wired to the same Supabase project unless you point it at a separate
   staging project.

Local development still uses the same Supabase project via `.env` — see below.

---

## Database schema

| Table | Columns |
| --- | --- |
| `profiles` | `id` (= auth user), `full_name`, `role` (`doctor` \| `patient` \| `caregiver`) |
| `patients` | `id`, `name`, `dob`, `is_demo`, `created_at` |
| `patient_access` | `patient_id`, `user_id` — who may see which patient |
| `documents` | `patient_id`, `hospital_name`, `doc_date`, `doc_type`, `raw_text`, `storage_path`, `source` (`hospital` \| `patient_provided`), `uploaded_at` |
| `analyses` | `patient_id`, `timeline_json`, `contradictions_json`, `missing_context_json`, `trends_json`, `doctor_summary`, `patient_summary`, `created_at` |

### Row Level Security

RLS is enabled on every table.

- A profile is readable and writable only by its own user.
- `patients`, `documents` and `analyses` are readable only by users with a `patient_access` row
  for that patient — enforced through the `SECURITY DEFINER` helpers `is_patient_owner()` and
  `can_access_patient()` (both revoked from direct API execution).
- The synthetic demo patient (`is_demo = true`) is readable by any signed-in user so the app is
  demonstrable without real data; only non-demo patients can be created from the app.

---

## Core flow

1. A doctor or caregiver signs in (email + password, or Google).
2. They paste or upload clinical documents into `documents`.
3. **Reconstruct patient history** calls the `reconstructHistory` server function.
4. That function loads the patient's documents (under the caller's RLS), sends them to the LLM
   with the Setu safety prompt, and parses the structured JSON response.
5. The result is written to `analyses` and rendered across Timeline / Doctor / Patient tabs.
6. Every contradiction, gap and trend point cites the source document(s) it came from; citations
   pointing at unknown document ids are stripped server-side before saving.

## Safety constraints (baked into the system prompt)

- Never diagnose, prescribe, or suggest treatment.
- Only reconcile and flag what is explicitly stated in the documents.
- Every flag must cite its source document, or it is discarded.
- The UI visually separates an **extracted fact** (muted teal) from an **AI-flagged pattern**
  (amber/clay — used for nothing else in the design system).

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values from your Supabase project
(Project Settings → API) and your Anthropic account.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | Publishable (anon) key |
| `SUPABASE_URL` | server | Supabase project URL for server functions |
| `SUPABASE_PUBLISHABLE_KEY` | server | Publishable key for server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Privileged access; never exposed to the client |
| `ANTHROPIC_API_KEY` | **server only** | LLM key used by the reconstruct function |
| `CRON_SECRET` / `CRON_SECRET_PREVIOUS` | server only | Optional — authenticates scheduled/cron requests |

Set the same variables in your Vercel project (Settings → Environment Variables) for
Production, Preview and Development.

---

## Seed data

Applied as a database migration (`supabase/migrations/`), so the demo works on a fresh database:

- One synthetic patient — **Ananya Iyer**, 56F.
- Five documents across three hospitals: Kokilaben (Mumbai), Apollo (Chennai) ×2,
  Manipal (Bengaluru), plus a patient-provided records folder.
- **Planted allergy contradiction:** penicillin allergy documented in Mumbai, "NKDA" recorded in
  Chennai where amoxicillin-clavulanate was then prescribed.
- **Planted rising creatinine trend:** 1.0 → 1.4 → 1.7 → 2.1 mg/dL across Feb 2024 – Nov 2024.
- **Planted follow-up gap:** nephrology review advised three times, never recorded as happening;
  metformin held in Bengaluru but still being taken per the patient's own note.

No real patient data is used anywhere in this project.

## Out of scope

Real hospital system integrations, diagnosis or prescription features, and anything requiring
real patient data.

## Local development

```bash
bun install
bun run dev
```
