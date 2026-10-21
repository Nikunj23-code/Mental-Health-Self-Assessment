import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, HeartPulse, BrainCircuit } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AssessmentCatalogPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/patient"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Standardized Clinical Screening
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Mental Health Self-Assessments
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Select a clinically validated, standardized screening instrument. Your responses are encrypted, evaluated using adaptive scoring rules, and translated into transparent recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PHQ-9 Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 bg-teal-50 text-teal-700 rounded-2xl group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-6 h-6" />
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                  <Clock className="w-3 h-3 text-slate-500" /> ~3 mins
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                PHQ-9 (Depression Screening)
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1 mb-4">
                Patient Health Questionnaire • 9 Questions
              </p>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Assesses the frequency of depressive symptoms over the past 2 weeks, including anhedonia, sleep disturbances, fatigue, and mood variations.
              </p>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Kroenke et al. (2001) Gold Standard</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Zero-latency Item 9 safety protocol</span>
                </div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Severity Bands: Minimal to Severe</span>
                </div>
              </div>
            </div>

            <Link
              href="/patient/assessment/phq-9"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all text-center shadow-md shadow-teal-600/20"
            >
              Start PHQ-9 Assessment →
            </Link>
          </div>

          {/* GAD-7 Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-6 h-6" />
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                  <Clock className="w-3 h-3 text-slate-500" /> ~2 mins
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                GAD-7 (Anxiety Screening)
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1 mb-4">
                Generalised Anxiety Disorder-7 • 7 Questions
              </p>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Evaluates symptoms of generalised anxiety over the past 2 weeks, focusing on excessive worry, restlessness, irritability, and muscle tension.
              </p>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Spitzer et al. (2006) Validated Scale</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Clinical score cutoff points (5, 10, 15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Integrated with therapist matching</span>
                </div>
              </div>
            </div>

            <Link
              href="/patient/assessment/gad-7"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all text-center shadow-md shadow-slate-900/20"
            >
              Start GAD-7 Assessment →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
