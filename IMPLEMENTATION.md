# Comprehensive Implementation Blueprint & Technical Specification
# MindAlign: Mental Health Self-Assessment Web Application with Intelligent Therapist Matching and Session Management

---

### Document Authority & Single Source of Truth
* **Document Status:** Authoritative Architectural & Implementation Specification
* **Target Audience:** Autonomous AI Coding Agents, Full-Stack Engineers, MCA Project Examiners
* **Academic Program:** Master of Computer Application (MCA) in AI & Machine Learning (Batch 2024–2026)
* **Institution:** School of Computing and Information System, Chandigarh University, Uttar Pradesh, Lucknow
* **Project Team:** Nikunj Omer (25LMMC1024), Priyanshu Kanaujia (25LMMC1025), Tushar Kumar (25LMMC1061), Uday Gupta (25LMMC1060)
* **Project Guide:** Mr. Sumit Bumbak
* **Brand Name:** **MindAlign** (Tagline: *"Intelligent Care. Proven Progress."*)
* **Strict Platform Constraint:** **Supabase Free + Vercel Hobby + GitHub ONLY**. Zero external paid tools, zero third-party databases, zero unpermitted hosting providers.

---

## 1. Product Vision, Core USPs & User Journeys

### 1.1 Product Vision
**MindAlign** (Mental Health Self-Assessment Web Application with Intelligent Therapist Matching and Session Management) is an evidence-based telepsychiatry and triage platform. It unifies self-assessment, severity scoring, algorithmic therapist matching, conflict-free appointment booking, clinical session documentation, and longitudinal recovery monitoring into a single, closed-loop web application.

### 1.2 The Four Unique Selling Propositions (USPs)
As established in `USP.md`, every technical and architectural decision must preserve and reinforce these four USPs:

1. **USP 1: Deterministic, Explainable Multi-Factor Matching Algorithm (XAI) with Severity-Acuity Triage**
   * Eliminates the "black-box" matching of commercial platforms (e.g., BetterHelp) and the cognitive search fatigue of static directories (e.g., Practo, Psychology Today).
   * Matches patients to therapists using a transparent 5-factor weighted formula and generates human-readable justifications explaining *why* the therapist was recommended.
   * Enforces strict severity-to-acuity routing: high-severity PHQ-9 ($\ge 20$) or GAD-7 ($\ge 15$) cases are strictly mapped to certified Clinical Psychologists/Psychiatrists.

2. **USP 2: Closed-Loop Longitudinal Measurement-Based Care (MBC) Architecture**
   * Connects the fragmented steps of the mental health pathway into an unbroken continuum:
     $$\text{Assessment} \longrightarrow \text{Severity Triage} \longrightarrow \text{Matched Booking} \longrightarrow \text{Clinical Session Notes} \longrightarrow \text{Longitudinal Trends}$$
   * Both Patient and Therapist dashboards render synchronized time-series graphs of depression and anxiety scores over time, correlated with therapist session interventions.

3. **USP 3: Decoupled Adaptive JSON-Schema Assessment Engine with Proactive Item-9 Crisis Interception**
   * Assessments are stored as dynamic JSON schemas in PostgreSQL rather than hardcoded forms, supporting dynamic skip logic (e.g., PHQ-2 screener branching to full PHQ-9).
   * An affirmative response ($> 0$) on PHQ-9 Item 9 (suicidal ideation) triggers an immediate, unblockable UI safety modal with national lifelines (Tele-MANAS `14416`, KIRAN `1800-599-0019`, `988`), sets a persistent `high_risk_flag`, and generates real-time alerts.

4. **USP 4: Privacy-First, Zero-AdTech Architecture with Granular Tri-Role RBAC & Auditability**
   * Zero third-party ad tracking, zero telemetry scripts, zero data monetization.
   * Strict separation of roles (`patient`, `therapist`, `admin`). Administrators can verify therapist credentials and audit system health, but are cryptographically and policy-wise barred from viewing private therapist-patient clinical session notes.

---

### 1.3 User Personas & Permissions Matrix

| Permission / Capability | `patient` | `therapist` | `admin` |
| :--- | :---: | :---: | :---: |
| Self-Register & Manage Own Profile | ✅ | ✅ (Requires Admin Approval) | ❌ (Created via Seed/CLI) |
| Complete PHQ-9 & GAD-7 Assessments | ✅ | ❌ | ❌ |
| View Own Longitudinal Score Trajectory | ✅ | ❌ | ❌ |
| View Assigned Patients' Score History | ❌ | ✅ (Only booked patients) | ❌ |
| Search & Receive Matched Therapists | ✅ | ❌ | ❌ |
| Define Recurring / Custom Calendar Slots | ❌ | ✅ | ❌ |
| Book & Cancel Appointments | ✅ | ✅ | ❌ |
| Record & Edit Clinical Session Notes | ❌ | ✅ (Own sessions only) | ❌ (Forbidden) |
| View Platform Audit Logs | ❌ | ❌ | ✅ |
| Approve / Reject Therapist Licenses | ❌ | ❌ | ✅ |
| Trigger Emergency Crisis Protocol | System Auto-Trigger | View Flagged Patients | View Incident Counts |

---

### 1.4 Clinical Scoring Rules & Severity Mapping

#### PHQ-9 (Patient Health Questionnaire-9 for Depression)
* **Scoring Range:** 9 questions $\times$ 0–3 points per question = Total score $0 - 27$.
* **Item Values:** $0 = \text{"Not at all"}$, $1 = \text{"Several days"}$, $2 = \text{"More than half the days"}$, $3 = \text{"Nearly every day"}$.
* **Severity Tiers:**
  * `0 - 4`: **Minimal / None** $\to$ General psychoeducation, self-care routines.
  * `5 - 9`: **Mild Depression** $\to$ Watchful waiting, guided self-help, optional counseling.
  * `10 - 14`: **Moderate Depression** $\to$ Counseling, Cognitive Behavioral Therapy (CBT).
  * `15 - 19`: **Moderately Severe Depression** $\to$ Intensive psychotherapy, clinical psychology.
  * `20 - 27`: **Severe Depression** $\to$ High-acuity clinical intervention, clinical psychology / psychiatry triage.
* **Critical Rule (Item 9):** Question 9 evaluates suicidal ideation. If $\text{Item 9} \ge 1$, trigger the **Immediate Crisis Protocol** regardless of total score.

#### GAD-7 (Generalized Anxiety Disorder-7)
* **Scoring Range:** 7 questions $\times$ 0–3 points per question = Total score $0 - 21$.
* **Severity Tiers:**
  * `0 - 4`: **Minimal Anxiety**
  * `5 - 9`: **Mild Anxiety**
  * `10 - 14`: **Moderate Anxiety** (Clinical threshold for active intervention)
  * `15 - 21`: **Severe Anxiety** (High-acuity clinical mapping)

---

### 1.5 Mathematical Specification of the Therapist Matching Engine

For a patient $p$ who completed assessments and specified preferences, the match score $S_{\text{match}}(p, t) \in [0, 100]$ for therapist $t$ is defined as:

$$S_{\text{match}}(p, t) = \left( w_1 \cdot f_{\text{spec}}(p, t) + w_2 \cdot f_{\text{sev}}(p, t) + w_3 \cdot f_{\text{avail}}(t) + w_4 \cdot f_{\text{rate}}(t) + w_5 \cdot f_{\text{pref}}(p, t) \right) \times 100$$

Where weights are strictly constrained:
$$w_1 = 0.35, \quad w_2 = 0.25, \quad w_3 = 0.20, \quad w_4 = 0.10, \quad w_5 = 0.10 \quad \left( \sum w_i = 1.0 \right)$$

#### Sub-Score Formulations:
1. **Specialty Alignment ($f_{\text{spec}} \in [0, 1]$):**
   $$f_{\text{spec}}(p, t) = \frac{|\text{PatientNeeds}(p) \cap \text{TherapistSpecialties}(t)|}{\max(1, |\text{PatientNeeds}(p)|)}$$
   * Where $\text{PatientNeeds}(p)$ is derived from assessment diagnosis (e.g., if PHQ-9 $\ge 10 \implies$ `"Depression"`, `"CBT"`; if GAD-7 $\ge 10 \implies$ `"Anxiety"`, `"Mindfulness"`).

2. **Severity Suitability ($f_{\text{sev}} \in [0, 1]$):**
   * If patient has **Severe** symptoms (PHQ-9 $\ge 20$ or GAD-7 $\ge 15$):
     * $f_{\text{sev}} = 1.0$ if therapist is a licensed **Clinical Psychologist** or **Psychiatrist** with crisis expertise.
     * $f_{\text{sev}} = 0.2$ if therapist is a general wellness counselor.
   * If patient has **Moderate** symptoms (PHQ-9: $10-19$ or GAD-7: $10-14$):
     * $f_{\text{sev}} = 1.0$ for Psychotherapists, CBT Specialists, and Clinical Psychologists.
   * If patient has **Mild/Minimal** symptoms:
     * $f_{\text{sev}} = 1.0$ across all qualified counselors.

3. **Availability Score ($f_{\text{avail}} \in [0, 1]$):**
   $$f_{\text{avail}}(t) = \min\left(1.0, \frac{\text{UnbookedSlotsNext7Days}(t)}{10}\right)$$

4. **Rating Score ($f_{\text{rate}} \in [0, 1]$):**
   $$f_{\text{rate}}(t) = \frac{\text{AverageRating}(t)}{5.0} \quad (\text{defaults to } 0.85 \text{ for newly approved therapists with } < 3 \text{ reviews})$$

5. **User Preference Concordance ($f_{\text{pref}} \in [0, 1]$):**
   $$f_{\text{pref}}(p, t) = 0.5 \cdot \mathbb{I}(\text{LangMatch}) + 0.5 \cdot \mathbb{I}(\text{GenderMatch})$$
   *(If patient specifies "No Preference", score defaults to $1.0$).*

---

## 2. Architecture & Free-Tier Platform Boundaries

### 2.1 Permitted Platforms & Free-Tier Budget Analysis

| Platform | Role in Project | Free Tier Limits (Strict Compliance) | Mitigation & Architecture Strategy |
| :--- | :--- | :--- | :--- |
| **Supabase Free** | PostgreSQL 17 Database, Supabase Auth, Storage, Row Level Security | • 500 MB DB storage<br>• 1 GB file storage<br>• 50,000 MAUs<br>• 200 Realtime connections<br>• Pauses after 7 days inactivity | • Lean relational schema; no blobs in DB.<br>• Profile documents & avatars stored in Supabase Storage with signed URLs.<br>• Automated GitHub Action cron ping to prevent project sleep. |
| **Vercel Hobby** | Next.js 15 App Router Hosting, Server Actions, Serverless Edge APIs | • 100 GB Bandwidth/mo<br>• 10s Serverless Execution limit<br>• Free personal team deploy | • Zero heavy background processes; matching engine runs in $< 50\text{ms}$ in Next.js Server Actions.<br>• Client components used only for charts, calendar, and forms. |
| **GitHub** | Code Repository, Issue Tracking, CI/CD Actions | • 2,000 CI minutes/mo<br>• Free public/private repos | • Fast, targeted CI test pipeline (Vitest + ESLint + TypeScript compile takes $< 90\text{s}$). |

### 2.2 System Architecture Diagram

```
+--------------------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER (REACT 19 / NEXT.JS)                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [ Patient Portal ]               [ Therapist Portal ]               [ Admin Portal ]           |
|   • Adaptive Assessment Form       • Calendar Slot Manager            • Credential Verifier      |
|   • Explainable Match Feed         • Patient Roster & Trends          • User Directory           |
|   • Conflict-Free Booking          • SOAP Session Note Authoring      • System Audit Logs        |
|   • Recharts Longitudinal Graph    • Crisis Alert Banner              • Crisis Incident Logs     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
                                        | (HTTPS / JSON / Server Actions)
                                        v
+--------------------------------------------------------------------------------------------------+
|                               VERCEL HOBBY (NEXT.JS 15 APP ROUTER)                               |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [ Middleware ]                                                                                 |
|   • Cookie-based Session Validation (@supabase/ssr)                                             |
|   • Route Guarding by User Role (/patient/*, /therapist/*, /admin/*)                            |
|                                                                                                  |
|   [ Server Actions & API Handlers ]                                                              |
|   • actions/assessment.ts  --> Server-side Validation, Score Aggregation, Crisis Intercept       |
|   • actions/matching.ts    --> Deterministic Multi-Factor Algorithm & Explainability Generator   |
|   • actions/booking.ts     --> Concurrency-Safe Slot Reservation Transaction                     |
|   • actions/sessions.ts    --> Structured Clinical SOAP Note Authoring & Update                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
                                        | (Encrypted TLS / Supabase Client)
                                        v
+--------------------------------------------------------------------------------------------------+
|                                 SUPABASE FREE TIER (POSTGRESQL 17)                               |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [ Supabase Auth ]                                                                              |
|   • auth.users Table (Email/Password, JWT Session Cookies, Password Hashing)                     |
|                                                                                                  |
|   [ PostgreSQL 17 Database Engine ]                                                             |
|   • public.profiles               • public.therapist_profiles     • public.therapist_availability|
|   • public.assessment_schemas     • public.assessments            • public.assessment_responses  |
|   • public.appointments           • public.session_notes          • public.audit_logs            |
|   • public.crisis_logs            • public.notifications                                         |
|                                                                                                  |
|   [ Security & Integrity Enforcement ]                                                           |
|   • Row Level Security (RLS) on 100% of public tables                                            |
|   • Postgres Triggers: on_auth_user_created, prevent_slot_double_booking, audit_logger           |
|                                                                                                  |
|   [ Supabase Storage ]                                                                           |
|   • Bucket 'avatars' (Public Read, Authenticated Upload)                                         |
|   • Bucket 'therapist-verification' (Private Read: Owner & Admin only)                           |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Complete Supabase Database Specification

### 3.1 Custom Types & Enums
Execute in Supabase SQL Editor:

```sql
-- Role Enumeration
CREATE TYPE user_role AS ENUM ('patient', 'therapist', 'admin');

-- Severity Levels
CREATE TYPE severity_level AS ENUM ('minimal', 'mild', 'moderate', 'moderately_severe', 'severe');

-- Assessment Type
CREATE TYPE assessment_type AS ENUM ('PHQ-9', 'GAD-7');

-- Appointment Status
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Crisis Status
CREATE TYPE crisis_status AS ENUM ('active', 'resolved', 'escalated');
```

---

### 3.2 Relational Tables DDL

```sql
-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    gender TEXT,
    preferred_language TEXT DEFAULT 'English',
    high_risk_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. THERAPIST PROFILES
CREATE TABLE public.therapist_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g., 'Licensed Clinical Psychologist', 'Cognitive Behavioral Therapist'
    bio TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    license_document_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    specialties TEXT[] NOT NULL DEFAULT '{}', -- e.g., ARRAY['Depression', 'Anxiety', 'CBT', 'Trauma']
    experience_years INTEGER NOT NULL DEFAULT 0,
    languages TEXT[] NOT NULL DEFAULT ARRAY['English'],
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
    total_reviews INTEGER NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. THERAPIST AVAILABILITY SLOTS
CREATE TABLE public.therapist_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_slot_time CHECK (end_time > start_time),
    CONSTRAINT unique_therapist_slot UNIQUE (therapist_id, slot_date, start_time)
);

-- 4. ASSESSMENT SCHEMAS (Decoupled JSON-Schema Engine)
CREATE TABLE public.assessment_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type assessment_type NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    schema_json JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PATIENT ASSESSMENTS
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    schema_id UUID NOT NULL REFERENCES public.assessment_schemas(id) ON DELETE RESTRICT,
    type assessment_type NOT NULL,
    total_score INTEGER NOT NULL CHECK (total_score >= 0),
    severity severity_level NOT NULL,
    has_crisis_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INDIVIDUAL ASSESSMENT QUESTION RESPONSES
CREATE TABLE public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL, -- e.g., 'phq9_q1', 'phq9_q9'
    question_text TEXT NOT NULL,
    score_value INTEGER NOT NULL CHECK (score_value >= 0 AND score_value <= 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. APPOINTMENTS
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    availability_slot_id UUID NOT NULL UNIQUE REFERENCES public.therapist_availability(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    meeting_link TEXT NOT NULL DEFAULT 'https://meet.jit.si/mha-', -- In-app deterministic Jitsi room
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CLINICAL SESSION NOTES (SOAP Documentation)
CREATE TABLE public.session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subjective_notes TEXT NOT NULL, -- Client self-reported feelings & life events
    objective_observations TEXT NOT NULL, -- Clinician affect, speech, engagement observation
    assessment_diagnosis TEXT NOT NULL, -- Clinical evaluation & progress markers
    plan_homework TEXT NOT NULL, -- Behavioral activation, CBT exercises, next steps
    mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 10),
    risk_assessment TEXT NOT NULL DEFAULT 'Low Risk',
    is_shared_with_patient BOOLEAN NOT NULL DEFAULT TRUE, -- Patient can view summary & homework
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. CRISIS LOGS (Item 9 Incident Records)
CREATE TABLE public.crisis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    item_score INTEGER NOT NULL,
    status crisis_status NOT NULL DEFAULT 'active',
    safety_plan_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_therapist_id UUID REFERENCES public.therapist_profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 10. SYSTEM NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'crisis', 'appointment'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. AUDIT LOGS (Compliance & Security Trail)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'ASSESSMENT_SUBMITTED', 'CRISIS_TRIGGERED', 'SLOT_BOOKED'
    table_affected TEXT NOT NULL,
    record_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 3.3 Indexes for Query Optimization
```sql
CREATE INDEX idx_assessments_patient_date ON public.assessments(patient_id, created_at DESC);
CREATE INDEX idx_assessments_severity ON public.assessments(severity);
CREATE INDEX idx_therapist_avail_date ON public.therapist_availability(therapist_id, slot_date, is_booked);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id, status);
CREATE INDEX idx_appointments_therapist ON public.appointments(therapist_id, status);
CREATE INDEX idx_session_notes_patient ON public.session_notes(patient_id, created_at DESC);
CREATE INDEX idx_crisis_logs_status ON public.crisis_logs(status, created_at DESC);
CREATE INDEX idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);
```

---

### 3.4 Database Functions & Triggers

#### Trigger 1: Automatic User Profile Creation on Signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Trigger 2: Atomically Reserve Availability Slot on Booking
```sql
CREATE OR REPLACE FUNCTION public.handle_appointment_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if slot is already booked
    IF (SELECT is_booked FROM public.therapist_availability WHERE id = NEW.availability_slot_id) THEN
        RAISE EXCEPTION 'This availability slot has already been booked by another patient.';
    END IF;

    -- Mark slot as booked
    UPDATE public.therapist_availability
    SET is_booked = TRUE
    WHERE id = NEW.availability_slot_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_created
    BEFORE INSERT ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_appointment_booking();
```

#### Trigger 3: Release Availability Slot on Cancellation
```sql
CREATE OR REPLACE FUNCTION public.handle_appointment_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE public.therapist_availability
        SET is_booked = FALSE
        WHERE id = NEW.availability_slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_status_change
    AFTER UPDATE OF status ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_appointment_cancellation();
```

---

### 3.5 Row Level Security (RLS) Policies (100% Coverage)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Patients can view therapist basic profile"
    ON public.profiles FOR SELECT
    USING (role = 'therapist');

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. THERAPIST PROFILES POLICIES
CREATE POLICY "Anyone can view verified therapists"
    ON public.therapist_profiles FOR SELECT
    USING (is_verified = TRUE OR auth.uid() = id OR public.is_admin());

CREATE POLICY "Therapists can update own profile"
    ON public.therapist_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can update verification status"
    ON public.therapist_profiles FOR UPDATE
    USING (public.is_admin());

-- 3. THERAPIST AVAILABILITY POLICIES
CREATE POLICY "Anyone authenticated can view unbooked slots"
    ON public.therapist_availability FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Therapists can manage own slots"
    ON public.therapist_availability FOR ALL
    USING (auth.uid() = therapist_id);

-- 4. ASSESSMENT SCHEMAS POLICIES
CREATE POLICY "Anyone authenticated can read active schemas"
    ON public.assessment_schemas FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Only admins can edit schemas"
    ON public.assessment_schemas FOR ALL
    USING (public.is_admin());

-- 5. ASSESSMENTS POLICIES
CREATE POLICY "Patients can view own assessments"
    ON public.assessments FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Therapists can view assessments of their booked patients"
    ON public.assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments
            WHERE appointments.patient_id = assessments.patient_id
            AND appointments.therapist_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view assessment metrics"
    ON public.assessments FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Patients can insert own assessments"
    ON public.assessments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- 6. ASSESSMENT RESPONSES POLICIES
CREATE POLICY "Users can view responses of authorized assessments"
    ON public.assessment_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments
            WHERE assessments.id = assessment_responses.assessment_id
            AND (assessments.patient_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Patients can insert assessment responses"
    ON public.assessment_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assessments
            WHERE assessments.id = assessment_responses.assessment_id
            AND assessments.patient_id = auth.uid()
        )
    );

-- 7. APPOINTMENTS POLICIES
CREATE POLICY "Users can view own appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = therapist_id OR public.is_admin());

CREATE POLICY "Patients can book appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Participants can update appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = patient_id OR auth.uid() = therapist_id);

-- 8. SESSION NOTES POLICIES (STRICT CLINICAL PRIVILEGE)
CREATE POLICY "Therapists can manage notes for their sessions"
    ON public.session_notes FOR ALL
    USING (auth.uid() = therapist_id);

CREATE POLICY "Patients can view shared session notes"
    ON public.session_notes FOR SELECT
    USING (auth.uid() = patient_id AND is_shared_with_patient = TRUE);

-- NOTE: Admins have NO policy to select from session_notes, preserving doctor-patient confidentiality!

-- 9. CRISIS LOGS POLICIES
CREATE POLICY "Admins and assigned therapists can view crisis logs"
    ON public.crisis_logs FOR SELECT
    USING (public.is_admin() OR auth.uid() = assigned_therapist_id);

CREATE POLICY "System/Patient can insert crisis incident"
    ON public.crisis_logs FOR INSERT
    WITH CHECK (auth.uid() = patient_id OR public.is_admin());

CREATE POLICY "Admins and therapists can update crisis resolution"
    ON public.crisis_logs FOR UPDATE
    USING (public.is_admin() OR auth.uid() = assigned_therapist_id);

-- 10. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark own notifications read"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = recipient_id);

-- 11. AUDIT LOGS POLICIES
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System can append audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
```

---

### 3.6 Supabase Storage Buckets Setup
1. **Bucket `avatars`**:
   * Public: `true` (Images accessible via public CDN URL).
   * File size limit: `2MB`.
   * Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
   * Policy: Authenticated users can upload to `avatars/{user_id}/*`.
2. **Bucket `therapist-verification`**:
   * Public: `false` (Private storage for medical licenses and degree certificates).
   * File size limit: `5MB`.
   * Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`.
   * Policy: Only owner therapist can upload; only owner and admins can download via signed URLs.

---

### 3.7 Seed Data SQL Script (`supabase/seed.sql`)
```sql
-- Insert Standard PHQ-9 Assessment Schema
INSERT INTO public.assessment_schemas (type, version, title, description, schema_json)
VALUES (
    'PHQ-9',
    1,
    'Patient Health Questionnaire (PHQ-9)',
    'Clinically validated 9-question instrument screening for the presence and severity of depression over the past 2 weeks.',
    '{
      "instructions": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
      "scale": [
        {"value": 0, "label": "Not at all"},
        {"value": 1, "label": "Several days"},
        {"value": 2, "label": "More than half the days"},
        {"value": 3, "label": "Nearly every day"}
      ],
      "questions": [
        {"key": "phq9_q1", "text": "Little interest or pleasure in doing things"},
        {"key": "phq9_q2", "text": "Feeling down, depressed, or hopeless"},
        {"key": "phq9_q3", "text": "Trouble falling or staying asleep, or sleeping too much"},
        {"key": "phq9_q4", "text": "Feeling tired or having little energy"},
        {"key": "phq9_q5", "text": "Poor appetite or overeating"},
        {"key": "phq9_q6", "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down"},
        {"key": "phq9_q7", "text": "Trouble concentrating on things, such as reading the newspaper or watching television"},
        {"key": "phq9_q8", "text": "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless"},
        {"key": "phq9_q9", "text": "Thoughts that you would be better off dead, or of hurting yourself in some way", "is_crisis_trigger": true}
      ],
      "adaptiveRules": [
        {
          "ruleId": "phq2_early_exit",
          "triggerOn": ["phq9_q1", "phq9_q2"],
          "condition": "sum == 0",
          "action": "SHOW_ABBREVIATED_NOTICE"
        }
      ]
    }'::jsonb
);

-- Insert Standard GAD-7 Assessment Schema
INSERT INTO public.assessment_schemas (type, version, title, description, schema_json)
VALUES (
    'GAD-7',
    1,
    'Generalized Anxiety Disorder (GAD-7)',
    'Clinically validated 7-question instrument measuring the severity of generalized anxiety symptoms over the past 2 weeks.',
    '{
      "instructions": "Over the last 2 weeks, how often have you been bothered by the following problems?",
      "scale": [
        {"value": 0, "label": "Not at all"},
        {"value": 1, "label": "Several days"},
        {"value": 2, "label": "More than half the days"},
        {"value": 3, "label": "Nearly every day"}
      ],
      "questions": [
        {"key": "gad7_q1", "text": "Feeling nervous, anxious, or on edge"},
        {"key": "gad7_q2", "text": "Not being able to stop or control worrying"},
        {"key": "gad7_q3", "text": "Worrying too much about different things"},
        {"key": "gad7_q4", "text": "Trouble relaxing"},
        {"key": "gad7_q5", "text": "Being so restless that it is hard to sit still"},
        {"key": "gad7_q6", "text": "Becoming easily annoyed or irritable"},
        {"key": "gad7_q7", "text": "Feeling afraid, as if something awful might happen"}
      ]
    }'::jsonb
);
```

---

## 4. Complete Project Directory Structure & File Registry

```
Mental-Health-Self-Assessment/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Automated Vitest, ESLint, TypeScript Typecheck
│       └── keep-alive.yml             # Weekly cron to prevent Supabase Free tier sleep
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Role-aware Login Screen
│   │   ├── register/
│   │   │   └── page.tsx              # Patient / Therapist Registration Form
│   │   └── layout.tsx                # Clean Auth Centered Container Layout
│   ├── (dashboard)/
│   │   ├── patient/
│   │   │   ├── assessment/
│   │   │   │   ├── [type]/
│   │   │   │   │   └── page.tsx      # Adaptive PHQ-9 & GAD-7 Assessment Flow
│   │   │   │   └── page.tsx          # Assessment Catalog & History
│   │   │   ├── match/
│   │   │   │   └── page.tsx          # Explainable Therapist Recommendations
│   │   │   ├── book/[therapistId]/
│   │   │   │   └── page.tsx          # Conflict-Free Calendar Slot Booking
│   │   │   ├── progress/
│   │   │   │   └── page.tsx          # Recharts Longitudinal Trends & Notes
│   │   │   └── page.tsx              # Patient Home Hub & Status Cards
│   │   ├── therapist/
│   │   │   ├── availability/
│   │   │   │   └── page.tsx          # Recurring / Custom Slot Management
│   │   │   ├── patients/
│   │   │   │   ├── [patientId]/
│   │   │   │   │   └── page.tsx      # Patient Assessment Trajectory & Notes
│   │   │   │   └── page.tsx          # Patient Roster & High-Risk Indicators
│   │   │   ├── sessions/
│   │   │   │   └── [appointmentId]/
│   │   │   │       └── page.tsx      # SOAP Clinical Session Documentation Form
│   │   │   └── page.tsx              # Therapist Schedule & Upcoming Appointments
│   │   ├── admin/
│   │   │   ├── verifications/
│   │   │   │   └── page.tsx          # Therapist License & Credential Approval
│   │   │   ├── crisis/
│   │   │   │   └── page.tsx          # Real-time Crisis Incident Review Log
│   │   │   ├── audit/
│   │   │   │   └── page.tsx          # System-wide Audit Trail Viewer
│   │   │   └── page.tsx              # Admin Global Analytics Dashboard
│   │   └── layout.tsx                # Role-aware Sidebar Navigation & Header Layout
│   ├── api/
│   │   └── matching/
│   │       └── route.ts              # Algorithmic Match Endpoint (GET / POST)
│   ├── favicon.ico
│   ├── globals.css                   # Tailwind Base Directives & Theme Variables
│   ├── layout.tsx                    # Root HTML, Fonts, Supabase Auth Provider
│   └── page.tsx                      # High-Impact Public Landing Page
├── components/
│   ├── assessment/
│   │   ├── AdaptiveQuestionCard.tsx  # Dynamic Radio Question Card with Branching
│   │   ├── CrisisSafetyModal.tsx     # Non-dismissible Emergency Lifeline Modal
│   │   └── ScoreResultCard.tsx       # Severity Band Indicator & Next Steps CTA
│   ├── matching/
│   │   ├── ExplanationBadge.tsx      # XAI Human-readable Match Rationale Pill
│   │   ├── FilterPreferences.tsx     # Language, Gender, Modality Filter Bar
│   │   └── TherapistMatchCard.tsx    # Ranked Card with Score Breakdown & Booking CTA
│   ├── booking/
│   │   ├── AppointmentCalendar.tsx   # Interactive Slot Picker Grid
│   │   └── BookingSummaryModal.tsx   # Appointment Confirmation Dialog
│   ├── progress/
│   │   ├── LongitudinalChart.tsx     # Recharts Multi-line Time-Series Plot
│   │   └── SessionNoteItem.tsx       # Accordion View for Shared Clinical Notes
│   ├── ui/                           # Minimalist Tailwind primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── Navbar.tsx                    # Responsive Brand Header with Role Switcher
│   └── NotificationDropdown.tsx      # Realtime Notification Bell
├── lib/
│   ├── clinical/
│   │   ├── scoring.ts                # PHQ-9 & GAD-7 Pure Scoring & Severity Logic
│   │   └── crisis.ts                 # Item-9 Safety Intercept & Alert Dispatcher
│   ├── matching/
│   │   ├── engine.ts                 # Weighted 5-Factor Algorithm Core
│   │   └── explainability.ts         # Natural Language Justification Generator
│   ├── supabase/
│   │   ├── client.ts                 # Browser Client (@supabase/ssr createBrowserClient)
│   │   ├── server.ts                 # Server Client (@supabase/ssr createServerClient)
│   │   └── middleware.ts             # Session Cookie Refresh & RBAC Redirects
│   └── utils.ts                      # ClassName merger & date formatters
├── server/
│   └── actions/
│       ├── auth.ts                   # Sign in, Sign up, Sign out Server Actions
│       ├── assessment.ts             # Submit Responses, Save Score, Check Item-9
│       ├── booking.ts                # Atomically Book & Cancel Appointments
│       ├── session-notes.ts          # Create & Update SOAP Clinical Notes
│       └── admin.ts                  # Verify Therapist, Resolve Crisis Flag
├── supabase/
│   ├── migrations/
│   │   └── 20261015000000_init.sql   # Full PostgreSQL Schema, RLS, & Triggers
│   └── seed.sql                      # Initial Schemas, Sample Verified Therapists
├── tests/
│   ├── unit/
│   │   ├── scoring.test.ts           # Clinical Scoring & Severity Classification
│   │   ├── matching.test.ts          # Deterministic Formula & Weight Verification
│   │   └── explainability.test.ts    # Justification String Generation Tests
│   └── integration/
│       └── rls.test.ts               # Supabase RLS Policy Isolation Tests
├── types/
│   ├── database.ts                   # Strongly Typed Supabase Database Schema
│   ├── assessment.ts                 # JSON Schema & Response Interfaces
│   └── matching.ts                   # Therapist Ranking & Explanation Types
├── .env.example                      # Documented Environment Variable Template
├── .eslintrc.json                    # ESLint Strict Next.js Configuration
├── .gitignore                        # Git Exclusions (Node, Env, Vercel, Cache)
├── middleware.ts                     # Next.js Root Edge Middleware Entrypoint
├── next.config.ts                    # Next.js Build Configuration (Strict React)
├── package.json                      # Dependency Manifest & Scripts
├── postcss.config.mjs                # PostCSS Tailwind Plugins
├── README.md                         # Project Overview & Setup Instructions
├── tailwind.config.ts                # Tailwind Custom Theme Colors & Typography
├── tsconfig.json                     # Strict TypeScript Compiler Options
└── vitest.config.ts                  # Vitest Test Runner Configuration
```

---

## 5. File-by-File Implementation Blueprint

### 5.1 Configuration & Infrastructure

#### `package.json`
```json
{
  "name": "mindalign",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.475.0",
    "next": "15.1.7",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "@types/react": "19.0.10",
    "@types/react-dom": "19.0.4",
    "eslint": "^9.20.1",
    "eslint-config-next": "15.1.7",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

#### `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### `lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Invoked from Server Component; ignore
          }
        },
      },
    }
  );
}
```

#### `middleware.ts`
```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 1. Unauthenticated users trying to access protected dashboards
  if (!user && (path.startsWith('/patient') || path.startsWith('/therapist') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // 2. Role-based Route Guarding
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    if (path.startsWith('/patient') && role !== 'patient') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/therapist') && role !== 'therapist') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

### 5.2 Clinical Algorithms & Core Logic

#### `lib/clinical/scoring.ts`
```typescript
import { assessment_type, severity_level } from '@/types/database';

export interface ScoreResult {
  totalScore: number;
  severity: severity_level;
  severityLabel: string;
  hasCrisisFlag: boolean;
  clinicalRecommendation: string;
}

export function calculatePHQ9(responses: Record<string, number>): ScoreResult {
  let totalScore = 0;
  for (let i = 1; i <= 9; i++) {
    totalScore += responses[`phq9_q${i}`] || 0;
  }

  const hasCrisisFlag = (responses['phq9_q9'] || 0) > 0;

  let severity: severity_level = 'minimal';
  let severityLabel = 'Minimal / None';
  let clinicalRecommendation = 'Supportive wellness, psychoeducation, and lifestyle pacing.';

  if (totalScore >= 20) {
    severity = 'severe';
    severityLabel = 'Severe Depression';
    clinicalRecommendation = 'Immediate clinical evaluation by a licensed Clinical Psychologist or Psychiatrist.';
  } else if (totalScore >= 15) {
    severity = 'moderately_severe';
    severityLabel = 'Moderately Severe Depression';
    clinicalRecommendation = 'Active psychotherapy (CBT) and clinical psychiatric consultation recommended.';
  } else if (totalScore >= 10) {
    severity = 'moderate';
    severityLabel = 'Moderate Depression';
    clinicalRecommendation = 'Structured psychotherapy and behavioral activation recommended.';
  } else if (totalScore >= 5) {
    severity = 'mild';
    severityLabel = 'Mild Depression';
    clinicalRecommendation = 'Watchful waiting, self-guided CBT resources, and stress reduction.';
  }

  return { totalScore, severity, severityLabel, hasCrisisFlag, clinicalRecommendation };
}

export function calculateGAD7(responses: Record<string, number>): ScoreResult {
  let totalScore = 0;
  for (let i = 1; i <= 7; i++) {
    totalScore += responses[`gad7_q${i}`] || 0;
  }

  let severity: severity_level = 'minimal';
  let severityLabel = 'Minimal Anxiety';
  let clinicalRecommendation = 'Normal stress management practices and mindfulness.';

  if (totalScore >= 15) {
    severity = 'severe';
    severityLabel = 'Severe Anxiety';
    clinicalRecommendation = 'Comprehensive clinical assessment and cognitive behavioral intervention.';
  } else if (totalScore >= 10) {
    severity = 'moderate';
    severityLabel = 'Moderate Anxiety';
    clinicalRecommendation = 'Cognitive restructuring, exposure therapy, and therapist-guided care.';
  } else if (totalScore >= 5) {
    severity = 'mild';
    severityLabel = 'Mild Anxiety';
    clinicalRecommendation = 'Relaxation techniques and watchful monitoring.';
  }

  return { totalScore, severity, severityLabel, hasCrisisFlag: false, clinicalRecommendation };
}
```

---

#### `lib/matching/engine.ts`
```typescript
import { severity_level } from '@/types/database';
import { generateExplanation } from './explainability';

export interface MatchingCandidate {
  therapistId: string;
  fullName: string;
  title: string;
  specialties: string[];
  experienceYears: number;
  languages: string[];
  averageRating: number;
  totalReviews: number;
  hourlyRate: number;
  unbookedSlotsCount: number;
  gender?: string;
}

export interface PatientCriteria {
  patientId: string;
  phq9Score?: number;
  phq9Severity?: severity_level;
  gad7Score?: number;
  gad7Severity?: severity_level;
  preferredLanguage?: string;
  preferredGender?: string;
}

export interface MatchResult {
  therapist: MatchingCandidate;
  totalMatchScore: number; // 0 - 100
  subScores: {
    specialty: number; // 0 - 1
    severity: number;  // 0 - 1
    availability: number; // 0 - 1
    rating: number;    // 0 - 1
    preference: number;// 0 - 1
  };
  explanation: string;
  rank: number;
}

export function rankTherapists(
  candidates: MatchingCandidate[],
  criteria: PatientCriteria
): MatchResult[] {
  // Determine patient clinical needs from scores
  const needs = new Set<string>();
  if ((criteria.phq9Score ?? 0) >= 10) {
    needs.add('Depression');
    needs.add('CBT');
  }
  if ((criteria.gad7Score ?? 0) >= 10) {
    needs.add('Anxiety');
    needs.add('Mindfulness');
  }
  if (needs.size === 0) {
    needs.add('Stress');
    needs.add('General Counseling');
  }

  const isSevere = criteria.phq9Severity === 'severe' || criteria.gad7Severity === 'severe';

  const scored = candidates.map((t) => {
    // 1. Specialty Alignment (35%)
    const matchedSpecialties = t.specialties.filter((s) => needs.has(s));
    const specialtyScore = Math.min(1.0, matchedSpecialties.length / Math.max(1, needs.size));

    // 2. Severity-Acuity Suitability (25%)
    let severityScore = 0.8;
    const isClinicalPro =
      t.title.toLowerCase().includes('psychologist') ||
      t.title.toLowerCase().includes('psychiatrist');

    if (isSevere) {
      severityScore = isClinicalPro ? 1.0 : 0.2; // Strict triage penalty for non-clinical in severe
    } else if (criteria.phq9Severity === 'moderate' || criteria.gad7Severity === 'moderate') {
      severityScore = 1.0;
    }

    // 3. Availability Score (20%)
    const availabilityScore = Math.min(1.0, t.unbookedSlotsCount / 10);

    // 4. Rating Benchmark (10%)
    const ratingScore = t.averageRating / 5.0;

    // 5. User Preference Concordance (10%)
    let prefScore = 0.5;
    if (criteria.preferredLanguage && t.languages.includes(criteria.preferredLanguage)) {
      prefScore += 0.25;
    }
    if (!criteria.preferredGender || criteria.preferredGender === 'No Preference' || criteria.preferredGender === t.gender) {
      prefScore += 0.25;
    }
    prefScore = Math.min(1.0, prefScore);

    // Weighted Total Score
    const totalMatchScore = Math.round(
      (0.35 * specialtyScore +
        0.25 * severityScore +
        0.20 * availabilityScore +
        0.10 * ratingScore +
        0.10 * prefScore) *
        100
    );

    const subScores = {
      specialty: specialtyScore,
      severity: severityScore,
      availability: availabilityScore,
      rating: ratingScore,
      preference: prefScore,
    };

    const explanation = generateExplanation(t, criteria, subScores, matchedSpecialties);

    return {
      therapist: t,
      totalMatchScore,
      subScores,
      explanation,
      rank: 0,
    };
  });

  // Sort descending by match score
  scored.sort((a, b) => b.totalMatchScore - a.totalMatchScore);

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
```

---

#### `lib/matching/explainability.ts`
```typescript
import { MatchingCandidate, PatientCriteria } from './engine';

export function generateExplanation(
  therapist: MatchingCandidate,
  criteria: PatientCriteria,
  subScores: { specialty: number; severity: number; availability: number; rating: number; preference: number },
  matchedSpecialties: string[]
): string {
  const points: string[] = [];

  // 1. Specialty justification
  if (matchedSpecialties.length > 0) {
    points.push(`Specializes in ${matchedSpecialties.join(', ')} directly targeting your screening profile.`);
  }

  // 2. Clinical Acuity justification
  if (subScores.severity === 1.0) {
    if (criteria.phq9Severity === 'severe' || criteria.gad7Severity === 'severe') {
      points.push(`Holds advanced clinical licensing (${therapist.title}) essential for high-acuity crisis support.`);
    } else {
      points.push(`Experience level (${therapist.experienceYears}+ years) matches your symptom severity.`);
    }
  }

  // 3. Availability justification
  if (therapist.unbookedSlotsCount >= 3) {
    points.push(`Immediate availability with ${therapist.unbookedSlotsCount} open sessions this week.`);
  }

  // 4. Rating & Patient Trust
  if (therapist.averageRating >= 4.8) {
    points.push(`Top-rated (${therapist.averageRating}/5.0 based on ${therapist.totalReviews} reviews).`);
  }

  // 5. Linguistic concordance
  if (criteria.preferredLanguage && therapist.languages.includes(criteria.preferredLanguage)) {
    points.push(`Conducts sessions in your preferred language (${criteria.preferredLanguage}).`);
  }

  return points.join(' ');
}
```

---

### 5.3 Server Actions & Database Operations

#### `server/actions/assessment.ts`
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { calculatePHQ9, calculateGAD7 } from '@/lib/clinical/scoring';
import { assessment_type } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function submitAssessment(
  type: assessment_type,
  schemaId: string,
  responses: Record<string, number>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  // 1. Score response server-side
  const scoreResult = type === 'PHQ-9' ? calculatePHQ9(responses) : calculateGAD7(responses);

  // 2. Insert main assessment record
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      patient_id: user.id,
      schema_id: schemaId,
      type,
      total_score: scoreResult.totalScore,
      severity: scoreResult.severity,
      has_crisis_flag: scoreResult.hasCrisisFlag,
    })
    .select('id')
    .single();

  if (assessmentError || !assessment) {
    throw new Error(`Failed to save assessment: ${assessmentError?.message}`);
  }

  // 3. Insert individual responses
  const responseInserts = Object.entries(responses).map(([key, val]) => ({
    assessment_id: assessment.id,
    question_key: key,
    question_text: key, // Can be matched with schema text
    score_value: val,
  }));

  await supabase.from('assessment_responses').insert(responseInserts);

  // 4. Item-9 Crisis Protocol Intercept
  if (scoreResult.hasCrisisFlag) {
    // Elevate profile risk flag
    await supabase.from('profiles').update({ high_risk_flag: true }).eq('id', user.id);

    // Record in crisis_logs
    await supabase.from('crisis_logs').insert({
      patient_id: user.id,
      assessment_id: assessment.id,
      item_score: responses['phq9_q9'] || 1,
      status: 'active',
    });

    // Generate high-priority notification for clinical alerts
    await supabase.from('notifications').insert({
      recipient_id: user.id,
      title: 'Safety Support Resources Available',
      message: 'Your responses indicate significant distress. Free 24/7 tele-counseling is immediately accessible via Tele-MANAS (14416).',
      type: 'crisis',
      link: '/patient/progress',
    });
  }

  // 5. Append to audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'ASSESSMENT_COMPLETED',
    table_affected: 'assessments',
    record_id: assessment.id,
    metadata: { type, score: scoreResult.totalScore, severity: scoreResult.severity, crisis: scoreResult.hasCrisisFlag },
  });

  revalidatePath('/patient/progress');
  revalidatePath('/patient');

  return {
    assessmentId: assessment.id,
    scoreResult,
  };
}
```

---

#### `server/actions/booking.ts`
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function bookAppointment(therapistId: string, slotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Fetch slot metadata
  const { data: slot, error: slotError } = await supabase
    .from('therapist_availability')
    .select('slot_date, start_time, end_time, is_booked')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) throw new Error('Slot not found');
  if (slot.is_booked) throw new Error('This slot is already booked.');

  // 2. Insert appointment (Trigger 'on_appointment_created' atomically locks the slot)
  const { data: appointment, error: bookError } = await supabase
    .from('appointments')
    .insert({
      patient_id: user.id,
      therapist_id: therapistId,
      availability_slot_id: slotId,
      appointment_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      status: 'scheduled',
      meeting_link: `https://meet.jit.si/mha-session-${slotId.slice(0, 8)}`,
    })
    .select('id')
    .single();

  if (bookError || !appointment) {
    throw new Error(`Booking failed: ${bookError?.message}`);
  }

  // 3. Notify Therapist
  await supabase.from('notifications').insert({
    recipient_id: therapistId,
    title: 'New Session Booked',
    message: `A patient has booked a session for ${slot.slot_date} at ${slot.start_time}.`,
    type: 'appointment',
    link: `/therapist/sessions`,
  });

  // 4. Log Audit
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'APPOINTMENT_BOOKED',
    table_affected: 'appointments',
    record_id: appointment.id,
    metadata: { therapistId, slotId, date: slot.slot_date },
  });

  revalidatePath('/patient');
  revalidatePath('/therapist');

  return { success: true, appointmentId: appointment.id };
}
```

---

#### `server/actions/session-notes.ts`
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SessionNoteInput {
  appointmentId: string;
  patientId: string;
  subjectiveNotes: string;
  objectiveObservations: string;
  assessmentDiagnosis: string;
  planHomework: string;
  moodRating: number;
  riskAssessment: string;
  isSharedWithPatient: boolean;
}

export async function recordSessionNotes(input: SessionNoteInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Verify therapist is author
  const { data: appointment } = await supabase
    .from('appointments')
    .select('therapist_id')
    .eq('id', input.appointmentId)
    .single();

  if (appointment?.therapist_id !== user.id) {
    throw new Error('Forbidden: Only the assigned therapist can document this session.');
  }

  // Upsert SOAP notes
  const { data: note, error } = await supabase
    .from('session_notes')
    .upsert(
      {
        appointment_id: input.appointmentId,
        therapist_id: user.id,
        patient_id: input.patientId,
        subjective_notes: input.subjectiveNotes,
        objective_observations: input.objectiveObservations,
        assessment_diagnosis: input.assessmentDiagnosis,
        plan_homework: input.planHomework,
        mood_rating: input.moodRating,
        risk_assessment: input.riskAssessment,
        is_shared_with_patient: input.isSharedWithPatient,
      },
      { onConflict: 'appointment_id' }
    )
    .select('id')
    .single();

  if (error || !note) {
    throw new Error(`Failed to save session notes: ${error?.message}`);
  }

  // Mark appointment completed
  await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', input.appointmentId);

  // Notify patient if homework/summary is shared
  if (input.isSharedWithPatient) {
    await supabase.from('notifications').insert({
      recipient_id: input.patientId,
      title: 'Session Summary & Homework Updated',
      message: 'Your therapist has shared clinical observations and next steps for your recovery.',
      type: 'info',
      link: '/patient/progress',
    });
  }

  revalidatePath('/therapist/patients');
  revalidatePath('/patient/progress');

  return { success: true, noteId: note.id };
}
```

---

## 6. Frontend & User Interface Architecture

### 6.1 Design System & Typography
* **CSS Framework:** Tailwind CSS 3.4
* **Color Palette (Calming Clinical Palette):**
  * Primary: Deep Slate Teal (`#0F766E` / `teal-700`)
  * Accent / Focus: Soft Sky Cyan (`#0EA5E9` / `sky-500`)
  * Neutral Surfaces: Crisp Off-White (`#F8FAFC` / `slate-50`)
  * Card Backgrounds: Pure White (`#FFFFFF`)
  * Text Primary: Slate Charcoal (`#0F172A` / `slate-900`)
  * Text Secondary: Muted Slate (`#64748B` / `slate-500`)
  * High Risk / Crisis Red: Amber Vermilion (`#DC2626` / `red-600`)
* **Icons:** `lucide-react`
* **Charts:** `recharts` (ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid)

---

### 6.2 Key UI Components

#### `components/assessment/CrisisSafetyModal.tsx`
```tsx
'use client';

import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, Heart } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAcknowledge: () => void;
}

export function CrisisSafetyModal({ isOpen, onAcknowledge }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <ShieldAlert className="h-8 w-8 flex-shrink-0" />
          <h2 className="text-xl font-bold">Immediate Support Is Available</h2>
        </div>

        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          Your assessment response indicates you may be experiencing severe distress or thoughts of self-harm. Please know that you are not alone, and help is available right now at no cost.
        </p>

        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-red-900 text-sm">Tele-MANAS (Govt. of India)</div>
              <div className="text-xs text-red-700">24/7 Toll-Free National Mental Health Helpline</div>
            </div>
            <a
              href="tel:14416"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition"
            >
              <PhoneCall className="h-4 w-4" /> 14416
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">KIRAN Helpline</div>
              <div className="text-xs text-slate-600">24/7 Disaster & Crisis Mental Health Support</div>
            </div>
            <a
              href="tel:18005990019"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition"
            >
              <PhoneCall className="h-4 w-4" /> 1800-599-0019
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 text-sm">Suicide & Crisis Lifeline</div>
              <div className="text-xs text-slate-600">International / US 24/7 Dial</div>
            </div>
            <a
              href="tel:988"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 transition"
            >
              <PhoneCall className="h-4 w-4" /> 988
            </a>
          </div>
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition"
        >
          I Understand & Wish to Continue to My Care Plan
        </button>
      </div>
    </div>
  );
}
```

---

#### `components/progress/LongitudinalChart.tsx`
```tsx
'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartPoint {
  date: string;
  phq9?: number;
  gad7?: number;
}

interface Props {
  data: ChartPoint[];
}

export function LongitudinalChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No assessment history recorded yet.</p>
        <p className="text-xs">Complete an assessment to track your symptom trends.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-2">
        <h3 className="font-semibold text-slate-800 text-sm">Longitudinal Symptom Severity Trajectory</h3>
        <p className="text-xs text-slate-500">Tracking PHQ-9 (Depression) and GAD-7 (Anxiety) over time</p>
      </div>

      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
          <Line
            type="monotone"
            dataKey="phq9"
            name="Depression (PHQ-9)"
            stroke="#0F766E"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#0F766E' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="gad7"
            name="Anxiety (GAD-7)"
            stroke="#0EA5E9"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#0EA5E9' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 7. Security, Privacy & Threat Mitigation

### 7.1 Strict Separation of Privileged Credentials
* **Public Client Scope (`NEXT_PUBLIC_SUPABASE_ANON_KEY`):**
  * Safe to bundle in client browser.
  * Grants zero table access without explicit RLS policies.
* **Server-Only Scope (`SUPABASE_SERVICE_ROLE_KEY`):**
  * NEVER prefixed with `NEXT_PUBLIC_`.
  * Used solely in server-side administrative jobs, database seeds, or test automation.
  * Zero usage in client components or browser runtime.

### 7.2 Zero-AdTech & Healthcare Data Sovereignty
* **No External Tracking Scripts:** No Google Tag Manager, Facebook Pixel, Hotjar, or telemetry scripts that could leak psychological diagnoses (preventing BetterHelp FTC violation scenarios).
* **Deterministic Jitsi Meet URLs:** In-app video sessions use deterministic, private hashed rooms (`https://meet.jit.si/mha-session-{hash}`) or embedded WebRTC with zero user profiling.

### 7.3 Protection Against Common Vulnerabilities
1. **SQL Injection:**
   * 100% mitigated using Supabase parameterized PostgREST calls and typed ORM queries (`@supabase/supabase-js`). Zero raw concatenated SQL strings.
2. **Cross-Site Scripting (XSS):**
   * Mitigated through Next.js React 19 JSX default HTML escaping and sanitization of clinical note inputs via `zod` schemas.
3. **Broken Object Level Authorization (BOLA / IDOR):**
   * Fully prevented by PostgreSQL RLS checking `auth.uid() = patient_id` or `auth.uid() = therapist_id` at the database kernel level on every query.

---

## 8. Environment Variables & Setup Guide

### 8.1 `.env.example`
```bash
# Supabase Free Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yvlzmzttucohewognkxl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bHptenR0dWNvaGV3b2dua3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTc5NzIsImV4cCI6MjEwNzU3Mzk3Mn0.3ow6usDbjP2kFImOVj9YxZ39SfrE14rhQ8YRlBKeZFo

# Server-side Administrative Key (Vercel Serverless Only - NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_here

# Application Base URL
NEXT_PUBLIC_SITE_URL=https://mindalign.vercel.app
```

---

## 9. Testing, Quality Assurance & Acceptance Criteria

### 9.1 Vitest Unit Tests (`tests/unit/scoring.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { calculatePHQ9, calculateGAD7 } from '@/lib/clinical/scoring';

describe('Clinical Scoring Module', () => {
  it('correctly calculates severe PHQ-9 score and triggers crisis on Item 9', () => {
    const responses = {
      phq9_q1: 3,
      phq9_q2: 3,
      phq9_q3: 2,
      phq9_q4: 2,
      phq9_q5: 2,
      phq9_q6: 3,
      phq9_q7: 3,
      phq9_q8: 2,
      phq9_q9: 1, // Suicidal ideation affirmative
    };

    const result = calculatePHQ9(responses);
    expect(result.totalScore).toBe(21);
    expect(result.severity).toBe('severe');
    expect(result.hasCrisisFlag).toBe(true);
  });

  it('correctly handles minimal GAD-7 with zero crisis flag', () => {
    const responses = {
      gad7_q1: 0,
      gad7_q2: 1,
      gad7_q3: 0,
      gad7_q4: 0,
      gad7_q5: 0,
      gad7_q6: 1,
      gad7_q7: 0,
    };

    const result = calculateGAD7(responses);
    expect(result.totalScore).toBe(2);
    expect(result.severity).toBe('minimal');
    expect(result.hasCrisisFlag).toBe(false);
  });
});
```

---

### 9.2 Acceptance Criteria Matrix

| Module | Acceptance Test | Pass Condition |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Login as Patient, attempt URL access to `/therapist` or `/admin` | Redirected to `/patient` immediately via Edge Middleware. |
| **Assessment & Crisis** | Submit PHQ-9 with item 9 $> 0$ | 1. Crisis Modal renders on UI.<br>2. `high_risk_flag` set in DB.<br>3. `crisis_logs` record inserted. |
| **Matching Algorithm** | Input Severe PHQ-9 score ($21$) | 1. Clinical Psychologist ranked #1.<br>2. Explanation explicitly notes severity-acuity match.<br>3. General Counselor penalized. |
| **Appointment Booking** | Simulate 2 simultaneous requests for same availability slot | Exactly 1 appointment created; 2nd request rejected with clear error message via Postgres transaction trigger. |
| **Session Notes (Privilege)** | Admin user attempts `SELECT * FROM session_notes` | Returns 0 rows (denied by RLS). Only author therapist and patient (shared notes) receive data. |
| **Longitudinal Chart** | Submit 3 assessments over time | Recharts renders 3 chronologically ordered data points connecting depression and anxiety trajectory lines. |

---

## 10. Deployment & Infrastructure Runbook (Supabase Free + Vercel Hobby + GitHub)

### 10.1 GitHub CI Workflow (`.github/workflows/ci.yml`)
```yaml
name: CI Quality Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript Type Check
        run: npm run typecheck

      - name: Run Vitest Unit Tests
        run: npm run test
```

---

### 10.2 Supabase Free-Tier Keep-Alive Action (`.github/workflows/keep-alive.yml`)
To prevent the Supabase Free tier database from pausing after 7 days of inactivity:
```yaml
name: Supabase Free-Tier Keep-Alive

on:
  schedule:
    # Runs every Tuesday and Friday at 04:00 UTC
    - cron: '0 4 * * 2,5'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase REST API
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            -H "apikey: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}" \
            "${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}/rest/v1/assessment_schemas?select=count"
```

---

### 10.3 Step-by-Step Vercel Hobby Deployment
1. **Push Repository to GitHub:** Push the codebase to `https://github.com/Nikunj23-code/Mental-Health-Self-Assessment`.
2. **Connect to Vercel:**
   * Go to [Vercel Dashboard](https://vercel.com/dashboard) $\to$ **Add New Project**.
   * Import `Nikunj23-code/Mental-Health-Self-Assessment`.
3. **Configure Environment Variables in Vercel:**
   * `NEXT_PUBLIC_SUPABASE_URL`: `https://yvlzmzttucohewognkxl.supabase.co`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `[Your anon key]`
   * `SUPABASE_SERVICE_ROLE_KEY`: `[Your service role key]`
   * `NEXT_PUBLIC_SITE_URL`: `https://your-project.vercel.app`
4. **Deploy:** Click **Deploy**. Vercel will execute `npm run build` and launch the project globally on its Edge network.

---

## 11. Sequential Implementation Roadmap for AI Coding Agent

Follow these phases sequentially. Do not start a subsequent phase until the current phase's verification checkpoint passes.

```
+---------------------------------------------------------------------------------------+
| PHASE 1: Scaffolding & Configuration                                                  |
| • Initialize Next.js 15 with Tailwind, Lucide, Recharts                               |
| • Configure tsconfig.json, next.config.ts, package.json                               |
| • Verification: 'npm run lint' and 'npm run typecheck' pass clean                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 2: Database Schema & Migration Execution                                        |
| • Execute 20261015000000_init.sql in Supabase SQL editor                              |
| • Enable RLS on all 11 tables and apply policies                                      |
| • Seed assessment schemas and sample therapists                                       |
| • Verification: Query assessment_schemas returns 2 records (PHQ-9, GAD-7)              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 3: Auth & Supabase SSR Integration                                              |
| • Implement lib/supabase/client.ts, server.ts, and middleware.ts                      |
| • Build login and register pages with role selection                                  |
| • Verification: User registers, profile created in DB, session cookie set              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 4: Clinical Engine & Adaptive Assessment (USP 3)                                |
| • Implement lib/clinical/scoring.ts and crisis.ts                                      |
| • Build AdaptiveQuestionCard and CrisisSafetyModal                                    |
| • Connect submitAssessment Server Action                                              |
| • Verification: PHQ-9 Item 9 triggers Safety Modal, high_risk_flag, and crisis_logs   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 5: Explainable Matching Engine (USP 1)                                          |
| • Implement lib/matching/engine.ts and explainability.ts                              |
| • Build TherapistMatchCard, ExplanationBadge, and Match Feed Page                     |
| • Verification: Unit tests pass; explanation strings correctly justify rankings       |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 6: Booking, Session Notes & Longitudinal Care (USP 2)                           |
| • Implement AppointmentCalendar and bookAppointment Server Action (conflict-free)     |
| • Implement SOAP SessionNoteForm and recordSessionNotes Action                        |
| • Implement Recharts LongitudinalChart on Patient and Therapist Dashboards            |
| • Verification: Simultaneous slot booking conflict prevented; score trajectory plots   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 7: Admin Auditing, Security Verification & Launch (USP 4)                       |
| • Implement Therapist Verification, Crisis Log Review, and Audit Trail Pages          |
| • Verify RLS: Admin cannot view session notes; Patient cannot view other patients     |
| • Configure GitHub Actions CI and deploy to Vercel Hobby                              |
| • Verification: Vercel deployment green, all acceptance criteria pass                 |
+---------------------------------------------------------------------------------------+
```

---

### Document Certification
This specification has been compiled with rigorous technical fidelity to the project synopsis and USP differentiation analysis, optimized strictly for **Supabase Free + Vercel Hobby + GitHub**.
