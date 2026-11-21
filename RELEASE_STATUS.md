# MindAlign release verification and operating status

**Updated:** 21 November 2026.  
**Source of truth:** live GitHub `main`, Supabase project `yvlzmzttucohewognkxl`, Vercel project `prj_cnEIAiNNsmG5zp2ucs17xVoxfq42`.

## Implemented and directly observed
- GitHub rollback snapshot exists at `backup/pre-mindalign-repair-2026-11-21`.
- Supabase migration history contains controlled screening, booking, cancellation, note editing, admin verification, privacy and account backfill procedures. The committed SQL files match the applied migration records.
- Seven responses for a test GAD-7 instrument yielded zero/minimal in an **explicitly rolled-back SQL transaction**. A test future-appointment insert and `book_session` call succeeded inside another rolled-back transaction. No actual test assessment/booking was retained.
- A read-only role privilege check returned: patient profile-role UPDATE **false**; clinician `is_verified` UPDATE **false**; authenticated audit INSERT **false**; authenticated SOAP UPDATE **false**.
- Auth users with missing `profiles` rows: **0** after backfill; therapist accounts with missing clinician profile: **0**.
- Original Next.js dependency `15.1.7` was blocked as vulnerable by Vercel. Restored the previously successful patched `15.1.11` dependency and lockfile.
- Live Vercel build statuses must always be checked for the latest HEAD; a `READY` build is **not** proof of functional clinical behavior.

## User-facing repairs
- Exactly one global Navbar, role-aware links and mobile navigation; guest landing redirects a signed-in user to their dashboard.
- Signup uses a database trigger, restricted public roles, required email confirmation when configured, secure callback and password recovery.
- Assessment runner reads active database questionnaires and validates responses through atomic server RPC; result is reloadable by ID.
- Patient dashboard, therapist portal, admin portal, matching and progress use live database names (`type`, `severity`, `created_at`, `id`, `specialties`, `experience_years`).
- Therapist match-fit shows factor breakdown and withholds personal percentages until there is a saved screening.
- Future slots are selected from actual clinician availability; booking is atomic and cancellation is controlled. No fake live slot is inserted as a purported clinical appointment.
- Appointment history, authorized clinician patient detail and private plan sharing are implemented.

## Release gates still requiring manual/clinical verification

1. **Auth E2E:** real email-confirmation delivery, login/logout, reset email, cookies, deep links, three user roles, stale and expired sessions.
2. **Care E2E:** patient form→saved results→matching→real future authorized clinician time slot→booking→clinician note→patient-visible plan→trend. Use synthetic accounts and approved test clinician slots.
3. **Safety:** clinical review of PHQ-9 item 9 language, abandonment handling, incident acknowledgement, clinician escalation and regional crisis resources. The app **must not claim professional emergency intervention or real-time clinician delivery** absent a verified operational pathway.
4. **Professional verification:** the existing `is_verified` flags are **application administrative flags**; they do not prove license authenticity without a signed credential-review process. Pre-existing rating numbers do not have a proven verified-review pipeline.
5. **Legal/privacy:** review DPDP/HIPAA applicability, consent, record retention, data export/deletion, notification privacy, incident response and external video-provider confidentiality before real health use.
6. **Data/calendar:** existing initial clinician time slots were historical at audit time. Real future booking requires clinicians to publish future availability. Do not invent availability.
7. **Ops:** Supabase baseline schema was originally provisioned without a checked-in migration. New migrations are versioned, but greenfield database bootstrap and rollback drills are incomplete.
8. **QA:** cross-browser responsive screenshot comparison, keyboard/screen-reader WCAG test, multiple concurrency/privacy tests, user acceptance and negative tests across roles are still needed.
9. **Deployment:** observe the latest Vercel `main` deployment as `READY`, check runtime errors, and verify live page access as the intended guest/role.

## Non-negotiable claims
- PHQ-9 total is sum of nine 0–3 responses; GAD-7 sum of seven 0–3 responses. The total and band are **screening** results, not a diagnosis or model confidence.
- Match-fit formula is transparent but **not** calibrated medical efficacy or probability.
- Real-world therapist credential, review provenance, appointment fulfillment and video confidentiality have not been independently established.
- No user password, service-role key, raw clinical answer or patient's SOAP note belongs in GitHub, screenshots or CI logs.

## Deployment and rollback
- GitHub `main` is linked to Vercel production. Environment variables (names): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Restore app from the backup branch only with explicit attention to the superseded vulnerable Next.js version and SQL schema migrations; rolling back *code alone* can reintroduce schema mismatch.
- Only migrate forward with a reviewed migration and a verified recovery plan for existing health data.
- For issues use `issues.md` (MA-001 through MA-064); do not mark an issue closed until its acceptance tests pass.

**Present designation: Functional repair build / academic demonstration. Not a clinically certified or fully E2E-verified production mental-health service.**
