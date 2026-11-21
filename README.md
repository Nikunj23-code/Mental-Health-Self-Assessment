# MindAlign — Intelligent Care. Proven Progress.

MindAlign is a Next.js / Supabase academic proof-of-concept connecting mental-health **screening** (PHQ-9 and GAD-7), transparent therapist **match-fit** scoring, booking, clinician session notes, and longitudinal symptom charts.

> **Academic demonstration, not a medical service.** Screening scores are not diagnoses. A match-fit percentage is not a probability of clinical success. Do not use with real patient health information or real clinical consultations until qualified clinical, privacy and security review is complete.

## Platform

| Layer | Implementation |
| --- | --- |
| UI | Next.js App Router, React 19, Tailwind CSS, Lucide, Recharts |
| Auth + DB | Supabase Auth (email/password and optional confirmation), PostgreSQL RLS |
| Server workflows | Supabase transactional PostgreSQL RPCs behind Next.js Server Actions |
| Deployment | Vercel Hobby, linked GitHub `main` |
| Database types | Generated from live Supabase schema in `types/database.ts` |
| Project ID | `yvlzmzttucohewognkxl` |
| Repository | [GitHub](https://github.com/Nikunj23-code/Mental-Health-Self-Assessment) |
| Website | https://mental-health-self-assessment.vercel.app |

## Patient journey

1. Sign up at `/register` or sign in at `/login`. When email confirmation is required, confirm the email before signing in. Reset a password at `/forgot-password`.
2. `/patient/assessment` → select PHQ-9 or GAD-7, loaded from `assessment_schemas.schema_json`; answer all 9 or 7 questions.
3. The server validates every response, computes the validated *total* (PHQ-9 0–27; GAD-7 0–21), and persists assessment plus responses in one PostgreSQL transaction. The result gets a durable ID at `/patient/assessment/result/[id]`.
4. `/patient/match` is personalized **only after** an assessment; it explains the factors used and excludes clinicians not marked approved. High severity restricts recommendations further. Reviews and calendar availability are separate signals, not predictions of outcome.
5. `/patient/book/[therapistId]` shows only available slots; booking is atomic. `/patient/appointments` contains history and cancellation.
6. `/patient/progress` displays stored time-series results and only those follow-up plans that a clinician explicitly shared.

## Therapist journey

- `/therapist`: practice overview and scheduled appointments.
- `/therapist/availability`: create/remove own future slots (uses Asia/Kolkata timezone for this academic demo).
- `/therapist/patients`: only assigned patients, with secured patient-detail subroutes.
- `/therapist/sessions/[appointmentId]`: record SOAP notes for authorized appointments. Only explicitly shared follow-up plans are available to patients; private SOAP content stays restricted.
- Newly registered therapist profiles remain **unverified** pending authorized admin review.

## Admin journey

- `/admin/verifications`: clinician review through an admin-checked database function.
- `/admin/crisis`: restricted safety event handling.
- `/admin/audit`: review tamper-restricted event records.
- Authenticated users cannot directly assign themselves `admin`, self-verify as clinicians, insert audit events, or update clinical notes.

## Setup

```bash
npm ci
cp .env.example .env.local
# Populate .env.local from your Supabase project settings (never commit secrets)
npm run dev
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For Vercel, set `NEXT_PUBLIC_SITE_URL` to the deployed canonical site. Configure Supabase Auth's **Site URL** and **Redirect URLs** to allow `https://mental-health-self-assessment.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local tests).

Do not expose a service-role secret to the client. This application does **not** require service-role access for ordinary user workflows.

## Database

An existing PostgreSQL database was initialized before this repair. Applied new migrations are saved under `supabase/migrations/` in their execution order. **They supplement, not replace, the existing baseline schema**. `IMPLEMENTATION.md` documents the original relational schema and conceptual specification, but its planned fields/architecture should not be used as a substitute for the current generated types. Check `RELEASE_STATUS.md` for precise rollout status and remaining work.

## Verification

```bash
npm run build
npm run typecheck
npm test
```

The CI workflow runs build, type-check and score tests. Real multi-account E2E, email delivery, database migration-rehearsal and clinical safety review are distinct release gates and have not been replaced by a green build.

## Original product documents

- `USP.md`: intended differentiators.
- `IMPLEMENTATION.md`: original technical **blueprint** (some claims and field names predate repair).
- `issues.md`: 64-issue source-based audit with history and remediation criteria.
- `RELEASE_STATUS.md`: verified changes and unverified release blockers.
- `SECURITY.md`: sensitive data, role and screening safety boundaries.

**License:** MIT. **Scope:** Academic prototype only, pending professional review.
