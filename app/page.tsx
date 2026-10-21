import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  BrainCircuit,
  LineChart,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  Lock,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold tracking-wide uppercase mb-6 animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Intelligent Mental Health Triage & Care Continuity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Clinical Self-Assessment.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-sky-600">
              Explainable Therapist Matching.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed mb-10">
            MindAlign eliminates the fragmented pathway in mental healthcare. Take clinically validated PHQ-9 & GAD-7 assessments, receive transparent multi-factor therapist recommendations, book sessions, and monitor your recovery trajectory over time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base shadow-md hover:shadow-lg transition"
            >
              <span>Begin Free Clinical Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border border-slate-200 shadow-sm transition"
            >
              <span>Sign In to Portal</span>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <span>PHQ-9 & GAD-7 Standardized</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <span>Zero-AdTech & Privacy-First</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <span>Real-Time Crisis Intercept</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 USPs Pillars Section */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">The 4 Core Differentiators</h2>
          <p className="text-slate-600 text-sm mt-3">
            Engineered to overcome the critical flaws of opaque commercial telehealth and high-friction therapist directories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* USP 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold mb-5 border border-teal-100">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
              USP 1 • Explainable AI
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">Transparent Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No black-box secrecy. Our 5-vector algorithm pairs patients by clinical severity acuity and generates clear, natural-language justifications for each recommendation.
            </p>
          </div>

          {/* USP 2 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 font-bold mb-5 border border-sky-100">
              <LineChart className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-sky-700 uppercase bg-sky-50 px-2 py-0.5 rounded">
              USP 2 • Measurement-Based Care
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">Longitudinal Trajectory</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Closed-loop care continuum connecting initial intake scores with post-session SOAP clinical notes and dual-dashboard Recharts trend visualization.
            </p>
          </div>

          {/* USP 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 font-bold mb-5 border border-red-100">
              <PhoneCall className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-red-700 uppercase bg-red-50 px-2 py-0.5 rounded">
              USP 3 • Adaptive & Safety
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">Item-9 Crisis Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Decoupled JSON-schema branching with zero-latency intercept on suicidal ideation—rendering immediate emergency lifelines (Tele-MANAS 14416) and alert flags.
            </p>
          </div>

          {/* USP 4 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 font-bold mb-5 border border-slate-200">
              <Lock className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
              USP 4 • Security & RBAC
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">Zero-AdTech Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict 3-tier Role-Based Access Control on PostgreSQL with 100% Row Level Security. Zero third-party ad pixels or data monetization.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Helpline Banner */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Experiencing an acute crisis or need emergency help?</h3>
            <p className="text-xs text-slate-400 mt-1">National free 24/7 mental health lifelines are available immediately.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:14416"
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
            >
              Tele-MANAS: 14416
            </a>
            <a
              href="tel:18005990019"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              KIRAN: 1800-599-0019
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
