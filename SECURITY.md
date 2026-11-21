# MindAlign Security & Clinical Safety Notes

**Purpose:** Academic demonstration of mental-health screening and care coordination. Do not accept real sensitive patient health data until qualified review and a legally appropriate deployment posture are established.

## Authentication and privilege
- Role derives from immutable/reviewed `profiles.role`, not editable `user_metadata`; public signup allows patient and unverified therapist only.
- Supabase RLS is enabled; column privileges prohibit changing `role` or `is_verified` through ordinary user updates.
- Screening, booking, cancellation, SOAP updates, safety events and admin review use authenticated, server-validated PostgreSQL RPCs. Privileged functions use fixed search paths and revoke anonymous execute grants.
- Ordinary users cannot insert arbitrary audit records or system notifications.
- `profiles` exposes a minimal column set to authenticated users. Contact addresses for admin case workflows come through `admin_contact_profiles`, which checks the admin role server-side.
- Do not put service-role keys or passwords in Git, client bundles, screenshots or public logs.

## Health data
- Patients can read only their own `assessments`. Assigned clinicians may read a booked patient's permitted screening history, not arbitrary patients.
- Clinician private `session_notes` rows are not selectable by patients. The `get_patient_shared_plans` procedure returns explicitly shared follow-up plans only.
- Assessments and answers are saved atomically; re-run the database contract tests after migrations.
- RLS is necessary but not enough: run cross-user REST and client-action penetration tests before real use.

## Clinical interpretation
- PHQ-9 (0–27) and GAD-7 (0–21) assess self-reported symptom frequency; they are not diagnostic tools by themselves.
- A nonzero PHQ-9 item 9 triggers an immediate support modal and private safety signal; persistence and follow-up are **not** equivalent to a completed emergency response. National lifelines may vary by region; users in immediate danger should contact local emergency services.
- No score may be described as a calibrated diagnostic-confidence percentage.
- The therapist matching weights describe fit against available data. They are not medical predictions.
- Existing therapist approval flags and initial demo review counts do not establish real-world licensing or independent review validity.
- The current Jitsi meeting URL should be treated as a demo placeholder, **not** a secure clinical telehealth meeting. Do not use it to exchange real clinical data.

## Security review TODO
- Verify real patient/therapist/admin role isolation and column-level access through JWT-backed integration tests.
- Add rate limiting and security-focused monitoring, privacy consent and retention, account data export/delete, human safety response ownership, incident runbook and clinical review.
- Enable leaked-password protection from Supabase Auth settings if available on the plan.
- Audit third-party assets and all claims of HIPAA/DPDP compliance; remove marketing claims not independently substantiated.

**Scope limits are deliberate; a successful build does not imply a certified medical service.**
