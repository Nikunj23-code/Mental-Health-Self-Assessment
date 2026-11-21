# Implementation update — 21 November 2026

This document retains the original 64-item audit. The initial issue register below labels every issue OPEN because it was created before implementation. That historical status is preserved for traceability; it is **not** a current status table.

**Since the audit:** Direct updates on GitHub `main` and Supabase migrations implemented role and verification permissions, auth-user provisioning and legacy profile backfill, transactional screening, safety events, appointment locking, booking/cancellation RPCs, clinical note restriction, therapist review and crisis-case review RPCs, role-aware single navigation, schema-driven screening and durable results, appointments, progress and clinician patient details.

**Verified:** Auth/profile orphan count 0; missing clinician profiles count 0; unauthorized table-level updates for role, clinician verification, audit and SOAP notes disabled; one GAD-7 screening and one future-slot booking completed within **rolled-back SQL test transactions**; multiple deployed Vercel revisions compiled successfully. **Not verified:** complete interactive browser E2E across real email confirmation, patient/clinician accounts, every route, recovery email delivery, production booking/revisit, crisis case notification delivery and external Jitsi security. Clinical professional review and legal privacy sign-off remain required before real patient use.

**Partial or still open:** MA-006 (complete real-time crisis delivery), MA-011/013 (professional credential and claims verification), MA-015/050–052 (full QA and migrations baseline), MA-031/032 (preferences and future real clinician slots), MA-040 (persist matching provenance), MA-054–060 (preview access, compliance, ratings and clinical meeting access), MA-061/063/064 (notifications, privacy lifecycle, observability), and all runtime E2E acceptance conditions not yet tested. Do **not** treat a green Vercel build as clinical production-readiness.

**Recovery:** `backup/pre-mindalign-repair-2026-11-21` records the original main commit `301e32774efa99a0ddb35dbeaae9a2f514d53e8e`. Live SQL migrations are versioned under `supabase/migrations` after the pre-existing schema baseline. See `RELEASE_STATUS.md` for current gates.

---

# MindAlign — Comprehensive Issues, Remediation & Product Acceptance Plan

**Audit date:** 21 November 2026 (IST)  
**Document status:** Initial evidence-based audit and implementation backlog — **NOT** a claim that the listed defects have been fixed.  
**Application:** `mental-health-self-assessment` / MindAlign  
**Repository:** https://github.com/Nikunj23-code/Mental-Health-Self-Assessment  
**Audited GitHub default branch:** `main`, commit `301e32774efa99a0ddb35dbeaae9a2f514d53e8e`  
**Vercel production deployment:** `dpl_EZ1q8GdpxPMvg8VqNSpDLJaE5oRs` (`READY`); commit `ce14815033cced711724fdd814f10e072a829cec` from `vercel/react-server-components-cve-vu-o1nx2y`  
**Supabase:** `yvlzmzttucohewognkxl`, `ACTIVE_HEALTHY`  
**Constraints:** GitHub + Supabase Free + Vercel Hobby; avoid new paid services; preserve the four core USPs.

> **Read this first.** This is a read-only audit of the source tree, selected source files, uploaded `README.md`, `USP.md` and `IMPLEMENTATION.md`, Vercel project/deployment/configuration metadata, and live Supabase metadata/read-only SQL. The actual authenticated production UI could not be exercised end-to-end through the available browser access. **Confirmed** means directly supported by source/DB metadata; **Reported** means user-observed; **Needs test** means an identified risk or missing verification. Do not claim all problems are fixed simply because production deployment status is `READY`. All fixes and safety tests still need implementation.

## 0. Executive verdict

**Status: NOT release-ready; do not market as a safe clinical/telehealth service or accept genuine sensitive mental-health data before the security and safety gates pass.** The project has a real, deployed Next.js codebase, live PostgreSQL/Supabase configuration, actual clinician and questionnaire records, and a working conceptual product model. The failures are primarily **contract drift between code and database**, **bad role/authorization boundaries**, **disconnected UI state and pages**, and **missing verified end-to-end workflows**. UI cosmetics alone cannot repair it.

### Measured state (read-only checks)

| Layer | Verified finding | Significance |
|---|---|---|
| GitHub | Public repository, 91 tree entries on `main`; no `.github/workflows`, `tests`, `supabase/migrations`, or app-specific `api/matching` files in the examined tree | Blueprint describes components and CI that are not implemented |
| Supabase | 11 public application tables, 31 current RLS policies, 2 active assessment schemas (PHQ-9 and GAD-7), 7 verified therapist profiles, 12 availability slots | Database structure exists, but feature integration is mismatched |
| Supabase booking | **0 future open slots** (12 historical/unusable-for-new-bookings open slots) | No bookable future appointment inventory at the audit time |
| Supabase usage | 0 assessments, 0 appointments, 0 crisis incidents, 4 audit records at audit time | No persisted clinical care journey to demonstrate; this is a count, not proof that every user attempt failed |
| Supabase DB lifecycle | No managed migrations returned; auth-user creation trigger not present in live trigger listing | Cannot demonstrate reproducible schema/auth provisioning |
| Vercel | Latest production build is `READY`, linked to correct GitHub repository; 3 configured production environment variables | Deployment exists, not proof of functional behavior |
| Vercel source | Latest production dependency-fix commit differs from default `main` (`package.json`, `package-lock.json` have different blob SHAs; reviewed application source blobs match) | Patch-version drift requires reconciliation |
| Browser | Authenticated UI session and comprehensive click tests not available in this audit | Reported UI issues are supported by code, not verified visually on every device |

**Evidence notation:** Each entry references paths on the checked GitHub commit; live DB evidence refers to read-only Supabase table/metadata and policy queries. The uploaded documents are **requirements**, not evidence that functionality exists. DB contents and project state can change after this snapshot.

## 1. Product contract: what the finished application MUST do

**Brand:** MindAlign — *Intelligent Care. Proven Progress.*  
**Role model:** Patient, Therapist, Admin.  
**Core value proposition:**
1. Validated PHQ-9/GAD-7 screening with **complete, server-validated answers**, score (0–27 / 0–21), symptom severity explanation, and a separate safety-support response for PHQ-9 item 9.
2. **Explainable**, clinically constrained therapist matching: specialty 35%, suitability 25%, availability 20%, verified rating 10%, preference 10%; show input data and sub-scores; **never represent a weighted affinity score as a probability of good clinical outcomes**.
3. **Closed-loop continuity:** screening → interpretation → recommended therapist → eligible real slot → confirmed booking → appropriate, clinician-authored session documentation → patient-visible allowed summaries and longitudinal trends.
4. **Privacy/security:** enforce ownership and authorization in the database and action layer; protect raw clinical notes, prevent privilege escalation and fake verification; no ad-tracking.

**Clinical caveats:** PHQ-9/GAD-7 are screening tools, not a medical diagnosis; they do not yield a scientifically established *AI confidence* probability. Provide "responses complete", validated score, interpretation, and an optional **match-fit score with factor breakdown**. A score must **not** be accompanied by unsupported claims of diagnostic certainty or clinical treatment effectiveness. Severe score routing is *clinical triage support*, not automated diagnosis or emergency dispatch.

### Canonical user state machine and routes

```text
PUBLIC
  /  (product overview, privacy & crisis resources)
  /login  /register
       └─ authenticated + server-validated profile role
          ├─ patient -> /patient
          │  ├─ needs baseline -> /patient/assessment
          │  │      └─ /patient/assessment/phq-9 OR /gad-7
          │  │           ├─ incomplete -> save draft locally / continue (no fabricated result)
          │  │           ├─ item-9 safety concern -> surface support + record verified safety event
          │  │           └─ valid submission -> /patient/assessment/<type>/results/<id> [NEW]
          │  ├─ completed assessment -> /patient/match
          │  │      └─ explanation + valid verified clinicians + actual future slots
          │  ├─ /patient/book/<therapistId> -> explicit review/confirm
          │  ├─ /patient/appointments [NEW] -> history, details, safe cancel/reschedule
          │  └─ /patient/progress -> recorded assessments, scores, chart, shared plan
          ├─ therapist -> /therapist
          │  ├─ onboarding/verification status
          │  ├─ /therapist/availability -> own slots
          │  ├─ /therapist/patients -> only valid assigned patients
          │  ├─ /therapist/patients/<patientId> [NEW]
          │  └─ /therapist/sessions/<appointmentId> -> authorized session note
          └─ admin -> /admin
             ├─ /admin/verifications -> credential review
             ├─ /admin/crisis -> restricted, auditable case-handling
             └─ /admin/audit -> trustworthy events
```

**When to show what**

| State | Visible primary CTA | Hide / disallow |
|---|---|---|
| Guest | Learn, register, sign in, safety resources | Patient clinical records, dashboard links |
| Authenticated patient, no assessment | Start PHQ-9 / GAD-7, see optional directory info | "94% matched" style personal scores, recovery improvements, fabricated confidence |
| Assessment in progress | Question number, answer-selected state, progress, Back/Next, save/exit, safety help | Results before valid submission |
| Assessment saved | Exact total, max, severity/threshold context, time, answer completeness, screening limitation, suggested next action | Fake probability, invalid clinical claims |
| Patient has result, no verified eligible available clinician | Clear no-match state and safe next steps | Non-clinician high-acuity recommendations, fake availability |
| Patient booked | Appointment details, timezone, join eligibility, cancellation policy, therapist | Duplicate booking actions and contradictory status |
| Progress with 0/1 results | Empty state / baseline; one recorded point only | "Improved" claims or fake trend |
| Progress with 2+ results | Chronological PHQ-9 and GAD-7 plot(s), change direction, dated history and eligible shared notes | Missing date points, private SOAP notes |
| Therapist unverified | Verification status and profile completion | Patient matching/profile badge, access beyond authorization |
| Therapist verified | Their availability, appointments, authorized patients and documentation | Admin features or unassigned patients |
| Admin | Verification workflow, system-level metrics, restricted safety queue, audit events | Private clinician-patient full notes by default |

## 2. Confirmed frontend ↔ live database contract drift

**Root-cause class A — do not fix by patching one query at a time.** Create a **single canonical typed data-access contract** against the live schema and replace every legacy field reference. The current `types/database.ts` defines nonexistent optional properties and an `any` index signature, allowing invalid queries to survive typechecking.

| Entity | Actual live columns / values | Invalid names or assumptions used in source |
|---|---|---|
| `therapist_profiles` | `id` is the profile/user FK; `specialties`, `experience_years` | `user_id`, `specializations`, `years_of_experience`; registration inserts `user_id` rather than `id` |
| `assessment_schemas` | `type`, `schema_json`, `is_active` | Query filters `instrument_type` |
| `assessments` | `type`, `severity`, `has_crisis_flag`, `created_at` | `assessment_type`, `severity_band`, `crisis_flag`, `completed_at` |
| `assessment_responses` | `question_key`, `question_text`, `score_value` | `question_id`, `response_value`; missing `question_text` insert |
| `crisis_logs` | `status`: `active`, `resolved`, `escalated` | Code inserts or filters `open` |
| `appointments` | `status`: `scheduled`, `completed`, `cancelled`, `no_show` | Code queries `confirmed`; `notes` column does not exist |
| `session_notes` | `created_at`, `plan_homework`, `is_shared_with_patient` | `session_date`, `homework_assigned`, `shared_summary`, `shared_with_patient` |
| `profiles` | `id`, `role`, `full_name`, etc. | Role can currently be altered via own-row update; see P0 security items |
| `types/database.ts` | Should be generated or checked from actual DB | Handwritten permissive legacy types conceal mismatches |

**Rule:** Treat all Supabase errors as errors. Never convert a query failure into `[]`, `0`, "No records", "Not taken", or "No therapists" without error-state differentiation.

## 3. Prioritized issue register

**Severity codes:** **P0 = security/safety or critical core-journey blocker**, **P1 = core feature broken/incomplete**, **P2 = UX, quality, operational correctness**.  
**Evidence labels:** **C** confirmed by source/live metadata; **R** user-reported and code-supported; **T** requires end-to-end or security test.  
**Status for every issue at audit:** `OPEN` (not fixed).

### 3A. P0 — must resolve before accepting real users

| ID | Issue / evidence | Precise remediation | Definition of done |
|---|---|---|---|
| **MA-001 [C]** | **Unrestricted self-role update.** `profiles` UPDATE RLS uses `auth.uid() = id`; broad `authenticated` UPDATE grant includes `role`. A user can potentially promote their own row to `admin`. | Revoke direct UPDATE of privileged columns for app roles; add column-scoped grants or RPC that only updates safe profile attributes; enforce role changes via privileged reviewed action + audit. | Patient's attempt to change `role` to `admin` is rejected at DB/API level; approved admin change succeeds through controlled process. |
| **MA-002 [C]** | **Therapist can potentially self-verify.** Own-row UPDATE policy for `therapist_profiles` permits changes to `is_verified`. | Make `is_verified`, license-review status, rating and other trusted columns admin-only. Create dedicated vetted verification flow; restrict grants and RLS. | Therapist cannot set `is_verified=true` or forge reviews, even with direct REST requests. |
| **MA-003 [C]** | **Signup input can carry arbitrary `role`; profile creation is unreliable.** `server/actions/auth.ts` accepts server-side `role`, including `admin`; performs unchecked `profiles.upsert`; no `on_auth_user_created` trigger was found live. | Allow public signup roles only `patient` and `therapist` with server enum validation; provision profile via carefully scoped auth trigger/privileged server path; handle email-confirmation/session timing, idempotency, and role-specific onboarding. | Signup reliably creates only authorized role, no orphaned auth user, no privilege escalation, accurate success/confirmation state. |
| **MA-004 [C]** | **Clinical assessment POST is incompatible with DB.** `server/actions/assessment.ts` queries `instrument_type`; inserts `assessment_type`, `severity_band`, `crisis_flag`; response columns wrong. | Align to `schema.type`, `assessments.type/severity/has_crisis_flag`, `assessment_responses.question_key/question_text/score_value`; require real schema ID; use transactional DB RPC for assessment + responses + safety events. | Test PHQ-9 and GAD-7 submit persists one complete assessment and all 9/7 responses, and reload returns same result. |
| **MA-005 [C]** | **Scorer trusts unvalidated server-action inputs.** `calculatePHQ9/GAD7()` uses `responses[q] || 0`; missing, noninteger, out-of-range, unknown type or extra fields can produce misleading totals. | Validate exact instrument, schema version, unique question IDs, 9/7 complete answers each integer 0–3 server-side; reject unknown keys; recompute and persist immutable raw answers + result together. | Score boundary tests 0/max/all thresholds, missing, NaN/negative/extra answers, different schema versions; no partial/false-low scores. |
| **MA-006 [C]** | **Safety handling is not an end-to-end protocol.** Item 9 modal appears client-side; persistence occurs only after full submit, `crisis_logs.status='open'` invalid, errors ignored, `high_risk_flag` not updated, no verified clinician alert path. | Define clinician-reviewed safety protocol; on affirmative item 9 show immediate support, persist a controlled safety event with reliable retry/idempotency, validated acknowledgement, safe escalation workflow and notification delivery; handle incomplete/abandoned form without losing safety event where lawful and appropriate. | In safe test environment, item9 1–3 triggers verified safety flow independent of score, flag/status/alert records are correct, 0 does not trigger; no claim that emergency staff were notified if not delivered. |
| **MA-007 [C]** | **Excess clinical note exposure.** Live patient RLS permits SELECT of the entire `session_notes` row when shared, while UI text promises **only plan/homework** shared. | Separate private SOAP note from patient-facing summary/plan in restricted view/table; only expose explicitly shared fields; audit sharing changes and enforce therapist–appointment–patient consistency. | Patient cannot retrieve S/O/A, private risk data, or unshared notes via REST even when one plan is shared. |
| **MA-008 [C]** | **RLS / table grants enable untrusted audit and notification writes.** Any authenticated user can insert `audit_logs` with arbitrary metadata and notifications to arbitrary `recipient_id`; broad grants also need review. | Restrict event inserts to DB-controlled triggers/service operation with invariant actor/recipient; implement audit append-only guarantees; reduce Data API grants to least privilege; validate notifications ownership. | Forged "THERAPIST_VERIFIED" event or arbitrary user notification is rejected; genuine event cannot be edited/deleted. |
| **MA-009 [C]** | **Booking integrity/identity not fully validated.** `bookAppointment(therapistId,slotId)` never proves slot belongs to that therapist; booking may target unverified therapist or invalid past slot. RLS allows broad participant UPDATE of appointments. | Atomic DB booking function: authenticated `patient` only; verified clinician; matching `slot.therapist_id`, future date/time and timezone; unique/collision prevention; server-authoritative status fields; restricted cancel/reschedule operations. | Mismatched therapist, past slot, fake status, cross-user booking and race attempts fail; one valid concurrent booking succeeds at most once. |
| **MA-010 [C]** | **Server Actions rely inconsistently on auth vs role.** `resolveCrisis` checks only login, and other actions check profile existence or user but not full role/assignment; page middleware is not an action authorization boundary. | Shared `requireRole` / `requireAppointmentAccess` / `requirePatientOwner` server guards; DB/RLS independently enforce them; authorization policy tests per action. | Each action rejects wrong role, wrong owner, missing/withdrawn verification, cross-role IDs and direct invocation. |
| **MA-011 [C]** | **Therapist status and care access are falsely trustworthy.** Candidate matching treats string `title` as clinical licensure, while clinical suitability must depend on verified professional qualifications and authorized scope. | Define verified credential type, high-acuity capability, approved specialties, and status with review evidence; high-acuity filter must exclude non-qualified candidates **before** ranking. | Severe-score profile never receives an ineligible clinician; no misleading "verified" icon for unverified practitioner. |
| **MA-012 [C]** | **Data visibility beyond purpose.** Public `profiles` therapist SELECT exposes all columns (including contact fields) rather than a curated public clinician card; `assessments` admin SELECT grants full data although intended admin view is metrics. | Build purpose-limited public/provider views, role-appropriate grants, aggregate-only admin metrics, avoid sensitive email/contact/individual clinical data exposure without authorization. | REST select tests prove no unauthorized PII, individual score or private SOAP data leaks. |
| **MA-013 [C/T]** | **Clinical safety/legal language overstates capability.** UI claims "clinical standards", encrypted responses, "zero latency", automatic alerts, verified ratings and HIPAA-aligned audits without proof; public Jitsi room link is deterministic. | Replace unverified claims with accurate language; privacy, professional-review, consent, region-specific crisis resources; external call provider/privacy review before real consultations; avoid fabricated quality labels. | Every patient-facing claim has verifiable implementation/evidence; privacy/security review signed off for any real-world use. |
| **MA-014 [C]** | **Failed database reads masquerade as empty dashboards.** `patient`, `progress`, `match`, `therapist`, `admin` pages discard Supabase errors; impossible columns return no data. | Central typed repository adapters + surfaced `error`, `empty`, `loading`, `ready` states; contextual retry and internal error IDs; avoid exposing query details to patient. | Broken query is diagnosed visibly to testers, logged privately, never rendered as "No data yet." |
| **MA-015 [C]** | **Insufficient deployment quality gates.** No actual test suite, CI workflow or versioned Supabase migrations found in current repo; no automated RLS or clinical scoring validation. | Create CI with tests, strict typecheck, lint, build, migration verification, sanitized E2E smoke; gate preview→production; no deployment of incomplete app. | Every relevant PR produces green CI and reproducible schema before promotion. |

### 3B. P1 — rebuild the connected end-to-end product

| ID | Issue / evidence | Precise remediation | Definition of done |
|---|---|---|---|
| **MA-016 [R/C]** | **Two headers.** `app/layout.tsx` always renders `<Navbar …/>`, while every dashboard route repeats `<Navbar />`. | One header, sourced from a role-aware parent layout. Remove page-level Navbar; use separate public/auth/dashboard shells; no nested main/footer duplication. | Exactly one header and one footer on every route, mobile and desktop. |
| **MA-017 [R/C]** | **Still shows Sign In/Get Started after login.** Page-level `<Navbar />` gets no `isLoggedIn`, so its guest branch renders even for authenticated users. | Centralize session/role state in server shell; redirect authenticated `/login`/`/register` appropriately; client refresh only as required after sign-in/out. | Logged-in pages never show guest CTA; sign-out immediately switches to public state; reload/navigation stays correct. |
| **MA-018 [C]** | **Public landing repeats after successful login.** `/` always returns guest landing, including sign-in/register hero. | Decide intentional behavior: authenticated `/` redirects to role dashboard, or hero/CTA becomes signed-in contextual; keep public marketing separately if needed. | Guest and signed-in landing experience unambiguous; brand logo leads to useful destination for each role. |
| **MA-019 [C]** | **Login redirects ignore original destination.** Middleware sets `?redirect=...` but `signIn` always `redirect('/<role>')`; auth errors/absent profile unhandled. | Read validated same-origin return target; resolve actual authorized role; preserve refreshed cookies on middleware redirects; show dedicated "complete profile" error state. | Protected deep links return to valid target after sign-in; no open redirect; unknown role never redirects to `/undefined`. |
| **MA-020 [C]** | **Registration falsely treats sign-up success as authenticated.** Client uses `setTimeout(router.push('/patient'))`; Supabase email confirmation / no-session / `profiles.upsert` failures are ignored. | Model `email_confirmation_pending`, `profile_creating`, `signed_in`, `profile_error`; verify actual session and provisioning; re-check credentials; no timed unconditional routing. | Both email-confirmation on/off scenarios, therapist review and duplicate email behave correctly. |
| **MA-021 [C]** | **Typed schema is fictional/permissive.** `types/database.ts` contains ghost fields, optional stand-ins, `any`, and enum values `confirmed/open` not in live DB. | Generate types from actual Supabase schema; shared Zod input/output contracts; remove `as any` from app DB access; migrate callers in one batch. | `npm run typecheck` detects intentional misspelled DB columns; all page queries use real columns. |
| **MA-022 [C]** | **Assessment runner is hardcoded, not schema-driven.** `app/(dashboard)/patient/assessment/[type]/page.tsx` chooses constant questions and never fetches active Supabase JSON schema; wrong URL slug silently treated as PHQ-9. | Fetch and validate active schema by canonical type, version and ordered questions; render dynamic question cards, block unknown type with 404; use explicit safe fallback only if clinically validated and visible. | Changing non-scoring display metadata in DB is reflected without editing React; invalid slug rejected. |
| **MA-023 [R/C]** | **Results lack requested transparent score presentation.** UI shows an immediate generic success/score but not item completeness, score/max, severity thresholds, interpretation provenance, instrument version or enough explanation. | Persistent results route; show `PHQ-9 12/27` or `GAD-7 9/21`, clear band, dated source, transparent sum, "screening not diagnosis", "what to do next"; optional accessible processing state, no fake model confidence. | User can explain score using own saved answers; returning user revisits the exact result. |
| **MA-024 [C]** | **Dashboard assessment history broken.** `patient/page.tsx` orders `completed_at`, compares `assessment_type`, renders `severity_band` / `crisis_flag`. | Use `created_at`, `type`, `severity`, `has_crisis_flag`; proper error and empty handling; canonical links. | Fresh saved assessment appears immediately in dashboard and can be reopened. |
| **MA-025 [C]** | **Progress tab broken at query and presentation.** Orders `completed_at`, and selects nonexistent `session_date`, `homework_assigned`, `shared_summary`, `shared_with_patient`. | Correct queries, separate shared-summary projection, timestamps, versioned assessment history; show 0,1,2+ states. | Progress loads without query errors, scores show after submit, allowed notes display after clinician shares. |
| **MA-026 [C]** | **Progress graph collapses assessments on same calendar date.** `dateMap` uses `"Nov 21"` as unique key, overwrites same-day results and loses year. | Use distinct assessment IDs + full timestamps; group by instrument and chronological x-axis; allow repeated same-day readings; only compute trends with >=2 actual points. | Two same-day assessments remain separately inspectable and are not silently overwritten. |
| **MA-027 [C]** | **Matching computes personalized scores even with NO assessments.** The code substitutes "Stress/General Counseling" defaults; users see unearned "Match Score". | Gate clinical matching behind required recent instrument(s); optional separate *directory browsing*, clearly labeled not personalized; distinguish unknown clinical profile from minimal symptoms. | Before assessment, no personalized match score; after assessment, score uses exactly saved state. |
| **MA-028 [C]** | **Matching queries latest assessment with wrong field names.** `match/page.tsx` sorts `completed_at`, checks `assessment_type` and `severity_band`. | Use canonical data model; correct latest per instrument as of matching time; explicitly handle missing/expired data. | Matching profile displays the actual latest PHQ/GAD score, severity and date. |
| **MA-029 [C]** | **Matching weights implementation differs from spec.** `engine.ts` availability denominator is `/5` vs blueprint `/10`; moderate-severe handling differs; exact-string specialty matching mismatches synonyms. | Establish one documented and tested scoring specification; normalize specialties with controlled taxonomy, acuity filter, weighted functions and deterministic tie-break; show score components. | Golden-vector tests yield expected ranking and consistent scores with written formula. |
| **MA-030 [C]** | **Match explanations and "confidence" can mislead.** Ratings and experience use fallback `||` values, potentially replacing genuine zero / no reviews with 4.8, 12 reviews, or 5 years. | Remove fabricated defaults; show "Not yet rated" for no reviews; only verified ratings; score explicitly "match-fit %" not success probability; disclose missing inputs. | Each displayed review count, availability, title and score factor reconciles with trusted DB data. |
| **MA-031 [C]** | **User preferences ignored.** Matching hardcodes `preferredLanguage:'English'`, `gender:'Not Specified'`; no actual preferences form or modality field, despite product spec. | Add patient preference fields (language, format, optional gender with privacy safeguards), persist only with consent and allow edit; use in matching and breakdown; avoid using gender as proxy for quality. | Changing preference legitimately changes relevant ranking reason, never clinician eligibility. |
| **MA-032 [C]** | **No future bookable slots.** Live DB has 12 unbooked slots, but 0 dated today/future. | Create seed/demo inventory on future dates with verified therapist reference, timezone and expiry controls; then let therapist manage new slots. | At least one genuine future demo slot for vetted sample account; no past slots listed. |
| **MA-033 [C]** | **Therapist pages cannot find own record.** `therapist/page.tsx`, `patients`, `availability`, `server/actions/availability`, `session-notes.ts` filter therapist profile by nonexistent `user_id`. | Use `therapist_profiles.id = auth.uid()`; fix all joins `profiles`, `specialties/experience_years`; check verified/onboarding state. | Approved clinician sees own dashboard/slots/roster; another therapist's records are inaccessible. |
| **MA-034 [C]** | **Admin verification UI queries absent fields.** `admin/verifications/page.tsx`, `VerificationList.tsx`, `admin/page.tsx` use `specializations`, `years_of_experience`, `user:profiles` alias assumptions and can silently show empty results. | Correct `specialties`, `experience_years`, embedded `profiles` relation, verified status; compare against source of truth. | Admin sees accurate complete pending/approved clinician list and can validate actions. |
| **MA-035 [C]** | **Admin crisis tab uses nonexistent `open` enum.** Counts, tabs and actions expect `open`, DB supports `active`. | Canonical `active/resolved/escalated`; resolve action enforces admin/assigned clinician and business rules; record resolution actor and timestamp. | An active seeded test incident appears in queue, can be legitimately reviewed/resolved, and history remains auditable. |
| **MA-036 [C]** | **Booking UI omits appointment history and cancellation path.** `cancelAppointment` exists but no client caller found; `patient` dashboard is only brief upcoming preview. | Add `/patient/appointments`, details, cancel/reschedule policy, therapist schedule integration, notifications, conflict/retry and refreshed views. | Patient can review and safely cancel eligible booking; therapist calendar and slots stay synchronized. |
| **MA-037 [C]** | **Therapist ↔ patient care relationship incomplete.** Blueprint promises `/therapist/patients/[patientId]`, missing from tree; roster links only to most recent SOAP note. | Add scoped patient detail with assessment history/graphs, appointments, permissible shared plan and high-risk flags, correct access checks. | Therapist sees only booked/assigned patient, complete permitted history, no unrelated user. |
| **MA-038 [C]** | **SOAP note action uses wrong `user_id`, trusts client `patientId`, and can mark appointment complete on note creation with no encounter verification.** | Derive patient from authorized appointment on server; require valid clinician and appointment state; draft vs finalized notes; clinician signature timestamp; revalidate both dashboards. | Wrong patient input cannot divert note; only assigned clinician documents appropriate encounter. |
| **MA-039 [C]** | **Therapist note-sharing copy contradicts DB.** `SoapNoteForm` says only plan is shared but `session_notes` policy exposes full row when `is_shared_with_patient=true`. | Implement sharing projection/split; make share controls explicit with preview/consent and safe defaults; never return sensitive SOAP fields to patient. | UI promise and actual REST response match exactly. |
| **MA-040 [C]** | **No reliable assessment-to-booking linking.** Recommendation is recomputed from mutable latest scores; booking doesn't preserve recommendation factors, assessment IDs or explanation version. | Record non-sensitive match run/version and selected clinician; link booking to assessment version and decision rationale where appropriate, without storing unnecessary PHI. | "Why recommended" shown in booking summary matches the original eligible recommendation context. |

### 3C. P2 — UX, product readiness, clarity and maintainability

| ID | Issue / evidence | Precise remediation | Definition of done |
|---|---|---|---|
| **MA-041 [C]** | Navbar menu uses `hidden md:flex` with no mobile navigation fallback. | Design responsive mobile sheet/menu and keyboard focus handling. | All modules reachable at 320px and by keyboard. |
| **MA-042 [C]** | Nav active state checks exact route `'/patient'` and partial paths inconsistently. | Central role-aware route definitions with current section and breadcrumbs, semantic aria-current. | Subroutes correctly highlight module; no wrong active tab. |
| **MA-043 [C]** | Inconsistent assessment slugs: catalog uses `/phq-9` and `/gad-7`, dashboard links `/phq9` and `/gad7`. | Canonicalize slugs, redirect legacy aliases or 404 invalid types. | All links lead to same intended assessment. |
| **MA-044 [C]** | UI uses duplicate `<main>` sections under root layout and page-level shells with `min-h-screen`. | Adopt one dashboard shell and correct landmark nesting, spacing, sticky header, footer. | No duplicated landmarks, overlapping footer or excess vertical whitespace. |
| **MA-045 [C]** | No central URL/navigation test matrix; pages link to flows that are absent from implemented tree. | Route manifest and automated link crawling in auth contexts; add missing routes or remove/prominently disable not-ready CTAs. | Every enabled button/link has a functioning, authorized destination. |
| **MA-046 [C]** | Generic empty states hide whether setup is missing, DB query failed, user has no data, or user lacks permission. | Specialized empty/error/403/404 states with clear next action and private telemetry for engineers. | Testers can distinguish all four cases. |
| **MA-047 [C]** | Timezone handling mixes UTC dates with local slots; 50-minute label does not derive from actual time range. | Use explicit IANA timezone + ISO timestamps and duration from stored slot; local display; guard DST and midnight boundaries. | No missed/misdated appointments across timezone settings. |
| **MA-048 [C]** | Recharts uses one fixed y-axis 0–27 for PHQ-9 and GAD-7 and no instrument-specific threshold bands. | Use separate chart series or distinct axes with 0–27 and 0–21 scales, accessible labels/tooltips and clear thresholds; no visual severity distortion. | Plot communicates true values/ranges, usable without color alone. |
| **MA-049 [C]** | No results history/deep-link detail page or print/share privacy controls. | Add immutable per-assessment results route, authorized access and carefully designed export only on explicit patient action. | Patient can revisit a past assessment, not exposed to others. |
| **MA-050 [C]** | Missing evidence of deployed responsive/accessible QA, animations/loading states, component library, design tokens. | Establish one professional design system (teal/ink/white), 8px spacing scale, type hierarchy, error/help states, 320/768/1440/1920 responsive reviews, WCAG 2.2 AA checks. | Screenshot review and keyboard/screen-reader audit pass without hurting accessibility. |
| **MA-051 [C]** | Missing change-controlled DB migrations despite complex schema and RLS; no reproducible local seed in repository. | Add versioned migrations and safe non-sensitive demo seed, including data version checks and rollback plan. | Fresh database reproduces exact schema, policies, two scales and valid future demo slots. |
| **MA-052 [C]** | `package.json` includes `next lint` but no clear ESLint config/workflow; current tree has no tests despite `IMPLEMENTATION.md` claiming them. | Adopt supported lint command/toolchain; add Vitest plus RLS/integration and Playwright-like E2E within budget; test before release. | Build, lint, typecheck, tests actually execute in CI. |
| **MA-053 [C]** | Default `main` dependency versions differ from Vercel production's automated React security fix branch. | Reconcile patch in reviewed PR to `main`, lock dependencies, pin deploy source, add dependency audit and promotion controls. | `main` and production source/dependency commit are auditable; no accidental rollback to old vulnerable dependency versions. |
| **MA-054 [C]** | Vercel variables observed only on `production` targets; preview environment parity unconfirmed. | Set properly scoped preview/test variables using separate safe resources as appropriate; verify no secrets in client bundle; no service role key in NEXT_PUBLIC. | Preview builds match safe configuration and cannot touch live PHI. |
| **MA-055 [C]** | Vercel's SSO deployment protection is enabled; evaluation/demo access may be blocked for non-team members. | Decide secure demo visibility (do not disable protection casually); provide reviewer access or safe public sanitized demo route. | Intended evaluator can reach authorized demo without bypassing patient privacy. |
| **MA-056 [C]** | README/USP/IMPLEMENTATION differ on high-acuity cutoff (README suggests PHQ-9 >=15, blueprint/USP >=20) and availability normalizer (/10 vs /5 actual). | Ratify a single clinician-reviewed scoring & triage spec, document compatibility/versioning; update all text and tests. | Same published thresholds/weights across UI, code, docs and tests. |
| **MA-057 [C]** | Marketing claims overstate clinical validation, certification, privacy compliance, "up to 40%" improvement, data encryption and zero-adtech guarantees. | Remove or precisely qualify unverified claims; add references, privacy notice and scope limitations; security review for analytics/third-party assets. | Product copy withstands evidence/clinical review. |
| **MA-058 [C]** | Default `therapist_profiles.average_rating=5.00` with zero reviews can mislead; no evidence of verified review creation path. | Store rating as unrated/null until authenticated verified appointment review; prohibit client-written aggregate ratings; use Bayesian rating only with disclosed basis. | Newly approved clinician is shown as "Not yet rated", not 5 stars. |
| **MA-059 [C]** | External `meet.jit.si` URL is predictable (`slotId.slice(0,8)`); no protected lifecycle, waiting room or access gate. | Disable real telehealth claim until authorized meeting integration, access control, consent, security and jurisdictional requirements reviewed; use safe demo placeholder if needed. | No unauthorized meeting reuse or disclosure; demonstrable access policy. |
| **MA-060 [C/T]** | Crisis resource regions mixed: India Tele-MANAS/KIRAN and US 988 labeled internationally; availability/hours need current verification. | Show region-specific verified official resource details, emergency services guidance and fallback; test resources and avoid wrong jurisdiction wording. | Links and dialing instructions appropriate for selected region; safety resources available from every page. |
| **MA-061 [C]** | Missing integrated notifications delivery/state, despite notifications table and "real-time" messaging claims. | Design recipient validation, read/unread, sending state, deduplication, opt-in preferences, and safe error handling. | Real event reaches intended recipient, appears in correct role view, and acknowledgement works. |
| **MA-062 [C/T]** | Password reset, email confirmation callback, profile recovery and full logout coverage not visible in repository tree. | Implement auth callback, reset/recovery and session invalidation screens with security boundaries; verify Supabase Auth settings. | New and returning account lifecycle passes mobile and desktop E2E. |
| **MA-063 [C]** | No privacy lifecycle UX: consent, data retention, account deletion/export, explicit sharing, and clinical note retention policy not implemented in examined tree. | Define legal policy and user controls appropriate to academic-demo scope; implement retention/export/delete securely before real launch. | User-facing privacy controls are real and consistent with DB handling. |
| **MA-064 [C/T]** | Sensitive personal and clinical information can appear in broad queries or error logs; no structured operational monitoring runbook or privacy-safe observability. | Structured server error IDs, safe diagnostic logs, request correlation, rate limits, abuse protections, alert runbook and log retention; never log raw answers unnecessarily. | Failing requests explain what broke to engineers without exposing PHI/credentials. |

## 4. Diagnosis of the exact five reported symptoms

1. **"After login it still shows that" / disconnected pages** → **MA-017, MA-018, MA-019, MA-020, MA-021, MA-024, MA-045.** On dashboard pages, unconfigured `<Navbar />` renders guest controls; root landing still displays guest CTAs. Runtime role and DB data contracts also disagree. **Fix authenticated shell and canonical schema first.**
2. **"Header showing 2 times"** → **MA-016, MA-044.** Root renders header; every dashboard page renders it again. **Remove every page-level header, use one shared layout.**
3. **"Immediately showing [result], needs accurate scoring/confidence"** → **MA-004, MA-005, MA-022, MA-023, MA-056.** Use a clinically valid total and severity, completion proof and transparent calculation, not an invented diagnostic-confidence percentage. Show a restrained "Calculating your score" state only while real persistence and validation complete; never fabricate processing delay as AI capability.
4. **"Therapist Match / Progress header tabs not working"** → **MA-025–MA-033, MA-043.** They route to real pages, but the pages query nonexistent fields, sometimes calculate bogus defaults, or have no valid future booking slots. **Fix data model and state prerequisites, not just links.**
5. **"The entire project not connected"** → **MA-001–MA-064.** This is a cross-layer integrity problem: stale types, missing migrations/tests, authorization issues, broken role-specific pages, no end-to-end care trail.

## 5. Design and navigation rebuild specification (professional, demo-ready)

### Common layout
- **Public shell:** logo, product explanation, clear Sign In / Get Started, privacy and safety access; **one** header; no patient data.
- **Auth shell:** centered sign-in/registration/recovery, optional minimal brand mark, no duplicate global dashboard navigation.
- **Patient shell:** `Dashboard | Assessments | Therapist Match | Appointments | My Progress`, notification, profile, logout. Hide unactionable clinical match scoring until an assessment exists; allow always-accessible safety help.
- **Therapist shell:** `Overview | Availability | Patients | Sessions`, verification badge/state, notification and profile; no administrative permissions.
- **Admin shell:** `Overview | Verification | Safety Queue | Audit`, restricted access and aggregated metrics; no raw private SOAP notes.
- One source of truth for route definitions, breadcrumbs, active tabs and access-control checks; show loading/empty/error/progress states, never duplicated nav.

### Suggested assessment completion UX
- **Intro:** screen purpose, time estimate, two-week timeframe, data handling, consent, "not a diagnosis".
- **Question flow:** 9/7 required answers; show selected option, question `n / total`, fraction completed and navigation; do not mistake the first screen's 1/9 position for 11% fully answered if unanswered.
- **Submit:** server validates all answers, resolves schema version, computes total and persists in a transaction; on failure retain answers and show retry.
- **Results:** large score and maximum (`PHQ-9 12/27`), named severity, colored but accessible range track, threshold table, score construction ("sum of 9 answers, each 0–3"), assessment timestamp, completion `9/9`, safety guidance when applicable, screening limitation and explicit CTAs to matched therapists/progress.
- **Avoid "87% diagnostic confidence"**: PHQ/GAD have validated scoring cutoffs, **not probabilistic model confidence**. For matching, a labelled `Match-fit: 78 / 100` with evidence is appropriate after the eligibility gate.

### Matching breakdown card
`Eligible verified clinician` → `Score 76/100 (match-fit, not medical probability)` → 5 inspectable components → specific reasons ("specialty aligns with anxiety", "2 future bookable slots", "speaks Hindi") → actual dates, time zone, pricing, verification state → Book. If no eligible clinician exists, show a safe transparent no-match state, not a high score for an unqualified clinician.

### Progress layout
Two instrument-specific trends, time points, baseline vs latest **only when >=2** valid assessments, threshold interpretation (no guaranteed "recovery"), all assessment history with dates/results, future next-assessment action, shared therapist-approved plan only, booked/completed appointments summary. Avoid "40% faster progress" without citation.

## 6. Build order and dependency-locked remediation milestones

| Phase | Must complete | Gate / evidence |
|---|---|---|
| **0 — Freeze, backups, and privacy** | Snapshot schema/policies (no PHI exported), protect current deploy, document migration baseline, narrow access to real patient data during fixes | Rollback available; privileged/clinical access risks triaged |
| **1 — Security first** | MA-001–003, MA-007–013: role escalation, clinician approval, protected notes, actor/recipient-bound writes, booking integrity, safety and consent | Automated negative-role and cross-account RLS tests green |
| **2 — Canonical schema/API** | MA-004–005, MA-014, MA-021, MA-051: typed real schema, validated transactions, migration files, real error states | Same schema generated on fresh DB; TypeScript rejects ghost columns |
| **3 — Shell/auth/routes** | MA-016–020, MA-041–045, MA-062: one header, role layout, mobile nav, auth callbacks, all links | Login/logout + deep linking + route crawl pass for all roles |
| **4 — Clinical screening + results** | MA-022–024, MA-056, MA-060: schema-driven PHQ/GAD, validated scoring, persisted results, safe item-9 handling | Exact boundary/edge scoring, safety tests, post-reload history |
| **5 — Explainable matching + booking** | MA-027–032, MA-036, MA-040, MA-047, MA-058–059 | Verified eligibility, score reconciliation, real future slots, concurrency tests |
| **6 — Therapist, admin, longitudinal care** | MA-025–026, MA-033–039, MA-048–049, MA-061 | Correct SOAP privacy, role portals, progress trends and safety/admin queue |
| **7 — Polished release** | MA-015, MA-050–055, MA-057, MA-063–064; docs alignment, final demo | Full automated quality gates, visual/accessibility review, safe production sign-off |

**Non-negotiable dependency order:** Do not begin a decorative redesign while the role elevation/privacy vulnerabilities and schema inconsistencies remain. Do not display personalized therapist match scores until assessments are saved and eligible clinicians are verified. Do not present a booking as confirmed until the database commit succeeds.

## 7. Test matrix (must be added to CI and signed off)

### Authentication and roles
- [ ] Guest `/patient`, `/therapist`, `/admin` redirects safely to sign-in.
- [ ] Patient registration works with both email verification enabled and disabled; profile exists and role is `patient`.
- [ ] Therapist registration persists `therapist_profiles.id = auth.uid()` and starts **unverified**; no auto-approved license.
- [ ] Crafted signup payload requesting `admin` rejected.
- [ ] Patient own-row update trying `role='admin'` rejected (DB/API).
- [ ] Therapist own-row update trying `is_verified=true` rejected (DB/API).
- [ ] Wrong-role route/action access rejected without redirect loop.
- [ ] Login from deep link returns to authorized target; failed login retains error; logout clears role UI; session refresh works.
- [ ] One header only, including hard refresh, navigation, 320px width, sign-out and back button.
- [ ] Mobile menu accesses every permitted module; keyboard and screen-reader nav pass.

### Clinical screening, scoring and safety
- [ ] `PHQ-9` schema has 9 prompts, correct 0–3 answer choices, active version, exact stable question keys.
- [ ] `GAD-7` schema has 7 prompts, correct 0–3 answers.
- [ ] PHQ-9 score totals 0,4,5,9,10,14,15,19,20,27 yield correct severity bands.
- [ ] GAD-7 totals 0,4,5,9,10,14,15,21 yield correct bands.
- [ ] Missing/duplicate/out-of-range/unknown/NaN answers rejected server-side; nothing saved.
- [ ] Successful PHQ-9 stores **9 response rows**; GAD-7 stores **7**, with accurate schema ID and immutable metadata.
- [ ] Failure halfway through response save rolls back all related inserts (no orphan assessment).
- [ ] Item-9 = 0: no crisis event; item-9 1,2,3: immediate support + verified persisted workflow.
- [ ] Crisis result cannot appear "resolved" without appropriate reviewer action and audit; no false alert-delivery claims.
- [ ] Submitted result displays total/max, band, explanation, completion, timestamp, safety context, and disclaimer.
- [ ] Result persists across refresh and appears on dashboard, matching and progress.

### Matching and appointments
- [ ] No screening data → no personalized match-fit percentage.
- [ ] Matching uses real latest PHQ/GAD results and stored preferences, not static defaults.
- [ ] Golden-vector tests cover all five weights, specialty synonyms, acuteness gates, ties and unknown input.
- [ ] Ineligible/nonverified clinician excluded, particularly for high-acuity cases.
- [ ] A clinician with zero reviews displays `Unrated`, not invented stars.
- [ ] Every displayed slot is real, available, and in the future with clear timezone.
- [ ] Booking rejects `slot.therapist_id != requested therapist`, past slots, wrong patient/role and unauthorised clinician.
- [ ] Two simultaneous clients booking same slot produce exactly one successful booking.
- [ ] Patient sees durable confirmation and accurate appointment history; therapist sees same event.
- [ ] Cancellation/reschedule release valid slot and update status without double-booking/re-opening unsafe past slots.
- [ ] Meeting access and privacy claims align with actual provider capabilities.

### Progress, clinical notes, admin and privacy
- [ ] 0, 1, and multiple saved scores render accurate distinct states (no bogus trend).
- [ ] Two same-day assessments and year boundaries preserve distinct chronological entries.
- [ ] PHQ-9 0–27 and GAD-7 0–21 visual ranges and threshold labels are accurate.
- [ ] Therapist can view only assigned patients, write valid own-appointment note; other therapist blocked.
- [ ] Patient REST read returns only specifically shared summary/plan, never full private SOAP fields.
- [ ] Admin cannot retrieve private SOAP notes; admin may view permitted aggregate metrics and audit.
- [ ] Verification queue uses actual columns; verify/revoke persists, logs actor, updates matching eligibility.
- [ ] Crisis queue uses `active/resolved/escalated` enum; only authorized actors can resolve.
- [ ] Audit event cannot be impersonated, edited, or deleted through client.
- [ ] Admin notifications cannot be spoofed by ordinary authenticated users.
- [ ] CI executes typecheck, lint, unit, integration, RLS, E2E, build and dependency security checks.
- [ ] Production matches reviewed commit, safe environment, migration level and intended access policy.
- [ ] Visual regression screenshots and WCAG checks complete for guest, patient, therapist, admin and error states.

## 8. Important architecture and compliance decisions

1. **Database authority.** Start from the real PostgreSQL schema; generate types. Do not rename production columns ad hoc to make one page render. If schema changes are necessary, version, migrate and test on a safe environment first. Create indexes and integrity constraints only with migration review.
2. **Supabase Auth authority.** Only `auth.uid()` is identity; a browser-supplied role/therapist ID/assessment score is not authority. Never derive authorization from user-editable `user_metadata`.
3. **RLS as last line of defense.** Keep RLS enabled; add least-privilege grants and secure dedicated views/RPC. Page redirects are not access controls; Server Actions and SQL need independent authorization.
4. **Clinical boundary.** Clinically qualified professionals must review instrument wording, classification, therapist eligibility and safety workflows; product is a screening/coordination prototype until validated.
5. **No invented AI.** A deterministic matching formula can be innovative/explainable, but weighted scores are not calibrated confidence, outcomes or clinical diagnoses. No fake clinician credentials, reviews, sessions or crises.
6. **Privacy-by-design.** Keep personally identifying/sensitive health information out of analytics, public link previews, unrestricted logs and unapproved AI services. Do not publicly expose clinical records or print raw credentials in documentation.
7. **Low-cost design.** Use current GitHub, Supabase and Vercel accounts; implement small transactional actions, lean read queries, index-backed time series and CI within free-tier constraints.
8. **Demo data isolation.** Seed non-real sample practitioners and synthetic screening history only in an explicitly safe demo environment; avoid impersonation of real professionals or live patient treatment claims.
9. **Safety UX.** Immediate help must remain accessible, but do not design a trap that prevents a user from obtaining emergency assistance or leaving a screen. An acknowledgement control must not be misrepresented as clinical risk resolution.
10. **Version and promotion.** Move reviewed dependency patch into main; only promote a build after clinical/security/UX gates pass; document safe rollback.

## 9. Traceability and review appendix

### Primary code evidence (audited `main` commit)
- `app/layout.tsx` — global Navbar + footer; `components/Navbar.tsx` — optional `isLoggedIn`, public links, role navigation.
- `app/(dashboard)/**/page.tsx` — redundant `<Navbar />`, several stale selectors and route handlers.
- `server/actions/auth.ts` — signup role/provisioning, login redirect, sign out.
- `middleware.ts` and `lib/supabase/{server,client}.ts` — session and role route gating.
- `app/(dashboard)/patient/assessment/[type]/page.tsx`; `server/actions/assessment.ts`; `lib/clinical/scoring.ts`; `components/assessment/CrisisSafetyModal.tsx` — question UI, scorer, persistence and safety.
- `app/(dashboard)/patient/match/page.tsx`; `lib/matching/{engine,explainability}.ts`; `components/matching/TherapistMatchCard.tsx` — matching, scores, rationale.
- `app/(dashboard)/patient/book/[therapistId]/{page,BookingForm}.tsx`; `server/actions/booking.ts` — slots, booking and cancellation.
- `app/(dashboard)/patient/progress/page.tsx`; `components/progress/LongitudinalChart.tsx` — progress and chart.
- `app/(dashboard)/therapist/{page,patients/page,availability/page,sessions/[appointmentId]/page}.tsx`; actions `availability.ts`, `session-notes.ts` — therapist workflows.
- `app/(dashboard)/admin/{page,verifications/page,crisis/page,audit/page}.tsx`; `server/actions/admin.ts` — admin.
- `types/database.ts`, `package.json`, `next.config.ts`, `vercel.json` — type, build and project configuration.

### Live system observations
- **Supabase:** project `yvlzmzttucohewognkxl`; direct count query `assessment_schemas=2`, `therapist_availability=12` (`future_open=0`), `therapist_profiles` verified=7, `assessments=0`, `appointments=0`; 31 RLS policies; registered enums and trigger metadata checked. No clinical row contents were needed or exported.
- **Vercel:** project `prj_cnEIAiNNsmG5zp2ucs17xVoxfq42`; deployment `READY`, source GitHub linked; 3 production env variable **names only** verified (values not exposed here). Git source deployment commit differs from `main` only in dependency files in the compared tree.
- **Uploaded requirements:** `USP.md` (4 USPs), `IMPLEMENTATION.md` (authority/architecture, SQL schema, proposed file tree and testing gates), `README.md` (current product claims and setup).

### Known audit limitations / follow-up diagnostics
- No authorized patient/therapist/admin credentials were used; therefore no successful/failed real browser sign-in, assessment submission, match or booking was executed.
- No write, migration, schema alteration, user impersonation, penetration testing or live clinical record access occurred.
- Vercel build `READY` confirms compilation/deployment status only, not HTTP route correctness or runtime data access.
- The uploaded technical blueprint contains *planned* CI/tests/pages that are absent from audited source tree, so do not count them as implemented.
- Actual Supabase counts were obtained by direct `COUNT(*)`; the preliminary `list_tables.rows` metadata was a stale estimate and **must not be used as an authoritative count**.

## 10. Release acceptance — the definition of "done"

**Do not mark this project fixed until:**
- [ ] All **P0** vulnerabilities and clinical blockers fixed and independently verified.
- [ ] All **P1** flows work across browser refresh and role changes, not just in mocked UI.
- [ ] Every enabled route/CTA tested for guest, patient, therapist and admin; no duplicate headers or guest UI after login.
- [ ] PHQ-9/GAD-7 exact scoring and storage demonstrated with test vectors and saved/retrieved history.
- [ ] Explainable matching produces eligible, evidence-backed results and a sensible pre-assessment state.
- [ ] Future availability → unique booking → authorized session note → patient-safe shared plan → progress closes the loop.
- [ ] SQL authorization, privacy leakage and crisis handling tests pass.
- [ ] Clean build, lockfile, CI, DB migrations and production commit parity verified.
- [ ] UX/accessibility review completed at mobile/tablet/desktop breakpoints and product claims reviewed by a qualified professional.
- [ ] Final demo walkthrough includes separate patient, therapist and admin scenarios with synthetic data.

**Final disposition at audit:** `OPEN — remediation plan delivered; implementation not started in this audit.`

---

*Prepared for a subsequent carefully sequenced implementation pass. Do not paste credentials, real patient clinical responses, or clinical notes into GitHub issues, screenshots, demo fixtures or documentation.*