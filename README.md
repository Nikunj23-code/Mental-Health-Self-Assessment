# MindAlign: Mental Health Self-Assessment Web Application with Intelligent Therapist Matching and Session Management

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ECF8E.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC.svg)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://mental-health-self-assessment.vercel.app)

---

## 📌 Project Overview
**MindAlign** is a longitudinal mental health support platform developed as a Master of Computer Application (MCA) in Artificial Intelligence & Machine Learning Capstone Project (2026) at Chandigarh University, Uttar Pradesh, Lucknow.

### 👥 Authors & Guidance
- **Students**:
  - Nikunj Omer (`25LMMC1024`)
  - Priyanshu Kanaujia (`25LMMC1025`)
  - Tushar Kumar (`25LMMC1061`)
  - Uday Gupta (`25LMMC1060`)
- **Project Guide**: Mr. Sumit Bumbak  
**School of Computing and Information System, Chandigarh University, Uttar Pradesh, Lucknow**

---

## 🌟 The 4 Core USPs (Unique Selling Propositions)

1. **Deterministic Explainable Multi-Factor Matching Algorithm (XAI)**
   - Scores verified clinicians using a multi-factor weighting scheme:
     - **35% Specialty Alignment**: Direct match with primary symptoms (e.g., Major Depressive Disorder, Generalised Anxiety).
     - **25% Severity-Acuity Suitability**: Severe scores (PHQ-9 $\ge 15$ or GAD-7 $\ge 15$) mandate licensed clinical psychologists or psychiatrists with $>5$ years clinical experience.
     - **20% Availability Score**: Evaluates prompt booking capability based on upcoming consultation openings.
     - **10% Quality Rating Score**: Incorporates verified consultation ratings ($1-5$ stars).
     - **10% User Preference Fit**: Takes into account user preferred language (Hindi, English) and session format (Online/In-person).
   - Generates transparent, human-readable natural language rationales (e.g. *"94% Match: Recommended for Severe Depression based on PHQ-9 score of 18..."*).

2. **Closed-Loop Longitudinal Measurement-Based Care (MBC)**
   - Interactive dual-dashboard visualization powered by Recharts.
   - Both patients and assigned therapists track PHQ-9 (Depression) and GAD-7 (Anxiety) score trajectories over time with clinical severity threshold markers (Mild: 5, Moderate: 10, Moderately Severe: 15, Severe: 20).
   - Structured SOAP (Subjective, Objective, Assessment, Plan) clinical notes authored by therapists with patient-visible sharing toggles.

3. **Decoupled Adaptive JSON-Schema Assessment Engine with Crisis Interception**
   - Assessment questionnaires (PHQ-9 and GAD-7) rendered dynamically from declarative JSON schemas in Supabase.
   - **Zero-Latency Item 9 Crisis Interception**: Answering $>0$ on PHQ-9 Question 9 immediately intercepts UI flow with an unclosable high-priority safety modal displaying emergency hotlines:
     - **Tele-MANAS**: `14416` / `1800-891-4416` (24/7 National Mental Health Helpline, India)
     - **KIRAN**: `1800-599-0019` (Ministry of Social Justice and Empowerment)
     - **National Suicide Prevention Lifeline (US)**: `988`
     - Automatic crisis logging to `crisis_logs` with admin notification dispatch.

4. **Privacy-First Zero-AdTech Architecture with Granular RBAC**
   - Strict zero-tracker policy: no Google Analytics, no Facebook Pixels, no third-party CDNs.
   - 22 Supabase Row-Level Security (RLS) policies enforcing complete isolation between patients, therapists, and administrators.
   - Atomic double-booking prevention through database-level slot lock triggers.

---

## 🛠️ Tech Stack & Constraints
- **Frontend / Full-Stack**: Next.js 15.1.7 (App Router), React 19, Tailwind CSS, Lucide React, Recharts.
- **Backend / Authentication**: Next.js Server Actions, `@supabase/ssr`, Supabase Auth with PKCE and secure cookies.
- **Database**: PostgreSQL on Supabase Free Tier (`yvlzmzttucohewognkxl`) with custom triggers and RLS.
- **Deployment**: Vercel Hobby Tier (`mental-health-self-assessment.vercel.app`).
- **Platform Compliance**: Strict adherence to Supabase Free + Vercel Hobby + GitHub only.

---

## 🚀 Environment Setup

Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yvlzmzttucohewognkxl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bHptenR0dWNvaGV3b2dua3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTc5NzIsImV4cCI6MjEwNzU3Mzk3Mn0.3ow6usDbjP2kFImOVj9YxZ39SfrE14rhQ8YRlBKeZFo
NEXT_PUBLIC_SITE_URL=https://mental-health-self-assessment.vercel.app
```

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Build for Production
```bash
npm run build
npm run start
```

---

## 🔑 Demo & Test Credentials

The database comes pre-seeded with verified test practitioners and consultation slots:

| Role | Name | Email | Specialty | Experience |
|---|---|---|---|---|
| **Therapist** | Dr. Ananya Sharma | `ananya.sharma@mindalign.in` | Depression, Anxiety, CBT | 8 years |
| **Therapist** | Dr. Vikram Malhotra | `vikram.malhotra@mindalign.in` | Severe Depression, Trauma, PTSD | 12 years |
| **Therapist** | Ms. Sneha Kapoor | `sneha.kapoor@mindalign.in` | Stress Management, Generalised Anxiety | 5 years |

*You can register any new patient or therapist account directly via the `/register` portal with instant sign-in.*

---

## 📂 Repository Structure
```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx             # Supabase Auth sign-in
│   │   └── register/page.tsx          # Multi-role patient/therapist registration
│   ├── (dashboard)/
│   │   ├── admin/                     # Admin control center, audit logs, crisis queue
│   │   ├── patient/                   # Patient portal, assessments, matching, booking, progress
│   │   └── therapist/                 # Clinician portal, schedule, SOAP notes, patients
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                       # Public landing page with Tele-MANAS hotline banner
├── components/
│   ├── assessment/                    # Adaptive cards, zero-latency CrisisSafetyModal, results
│   ├── matching/                      # Therapist cards, XAI ExplanationBadge
│   ├── progress/                      # Recharts LongitudinalChart
│   └── Navbar.tsx                     # Dynamic role-aware navigation
├── lib/
│   ├── clinical/
│   │   ├── crisis.ts                  # Hotline registry & Item 9 triggers
│   │   └── scoring.ts                 # PHQ-9 & GAD-7 validation algorithms
│   ├── matching/
│   │   ├── engine.ts                  # 5-factor deterministic matching engine
│   │   └── explainability.ts          # Transparent XAI rationale generator
│   └── supabase/                      # SSR client & server helpers
├── server/actions/                    # Server Actions: auth, booking, assessment, notes, admin
├── types/database.ts                  # Fully typed Supabase schema interfaces
├── IMPLEMENTATION.md                  # Comprehensive AI agent specification
└── USP.md                             # Technical USP design document
```

---

## 📜 Academic Integrity & License
Submitted in partial fulfillment of the requirements for the award of Master of Computer Application (MCA) in AI & ML (2026), Chandigarh University.
Licensed under the MIT License.
