# Setu

Setu is a continuity-of-care workspace for reconciling synthetic clinical records across hospitals in India. The interface distinguishes extracted facts from AI-flagged patterns and links every flag back to its source documents.

## Stack

- Next.js 16 App Router + React 19
- Supabase Postgres, Auth, and Storage
- Vercel deployment with GitHub CI/CD

## Environment variables

Copy `.env.example` into your deployment environment. Public Supabase values are used by browser clients; service credentials and the Anthropic key must remain server-side.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `ANTHROPIC_API_KEY` (server only)

The connected Supabase project already contains the Setu tables, RLS policies, and one synthetic demo patient seeded for the preview.

## Safety boundary

Setu only reconciles what is explicitly stated in supplied records. It does not diagnose, prescribe, or suggest treatment. AI-flagged patterns are descriptive and require qualified clinical review; this is not medical advice.

## Deployment

Connect the repository to Vercel and enable automatic deployment from `main`. Configure the environment variables in the Vercel project settings before enabling server-side reconstruction.
