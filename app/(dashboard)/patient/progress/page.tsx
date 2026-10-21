import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, TrendingDown, ClipboardList, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { LongitudinalChart } from "@/components/progress/LongitudinalChart";
import Navbar from "@/components/Navbar";

export default async function PatientProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all completed assessments chronologically
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("patient_id", user.id)
    .order("completed_at", { ascending: true });

  // Fetch shared session notes
  const { data: sharedNotes } = await supabase
    .from("session_notes")
    .select(`
      id,
      session_date,
      homework_assigned,
      shared_summary,
      created_at,
      therapist:therapist_profiles(
        user:profiles(full_name)
      )
    `)
    .eq("patient_id", user.id)
    .eq("shared_with_patient", true)
    .order("session_date", { ascending: false });

  // Transform assessments into chart data points grouped by date
  const dateMap: Record<string, { date: string; phq9?: number; gad7?: number }> = {};

  const assessmentList = (assessments || []) as any[];

  assessmentList.forEach((a) => {
    const dStr = new Date(a.completed_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap[dStr]) {
      dateMap[dStr] = { date: dStr };
    }

    if (a.assessment_type === "PHQ-9") {
      dateMap[dStr].phq9 = a.total_score;
    } else if (a.assessment_type === "GAD-7") {
      dateMap[dStr].gad7 = a.total_score;
    }
  });

  const chartData = Object.values(dateMap);

  // Calculate clinical trajectory stats
  const phq9List = assessmentList.filter((a) => a.assessment_type === "PHQ-9");
  const gad7List = assessmentList.filter((a) => a.assessment_type === "GAD-7");

  const initialPHQ9 = phq9List[0]?.total_score;
  const latestPHQ9 = phq9List[phq9List.length - 1]?.total_score;
  const phq9Diff = initialPHQ9 !== undefined && latestPHQ9 !== undefined ? initialPHQ9 - latestPHQ9 : null;

  const initialGAD7 = gad7List[0]?.total_score;
  const latestGAD7 = gad7List[gad7List.length - 1]?.total_score;
  const gad7Diff = initialGAD7 !== undefined && latestGAD7 !== undefined ? initialGAD7 - latestGAD7 : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/patient"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Closed-Loop Measurement-Based Care (MBC)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Clinical Recovery Trajectory
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Standardized tracking of your symptom reductions over time. Clinical studies establish that regular symptom tracking accelerates therapeutic breakthroughs by up to 40%.
          </p>
        </div>

        {/* Milestone Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Assessments Taken</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{assessments?.length || 0}</div>
            <span className="text-[11px] text-teal-600 font-medium">Standardized Screenings</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">PHQ-9 Baseline vs Now</span>
            <div className="text-2xl font-black text-teal-800 mt-1">
              {initialPHQ9 !== undefined ? `${initialPHQ9} → ${latestPHQ9}` : "N/A"}
            </div>
            {phq9Diff !== null ? (
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${phq9Diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                <TrendingDown className="w-3.5 h-3.5" />
                {phq9Diff >= 0 ? `${phq9Diff} pts reduction` : `+${Math.abs(phq9Diff)} pts increase`}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Take 2+ to see trend</span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">GAD-7 Baseline vs Now</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {initialGAD7 !== undefined ? `${initialGAD7} → ${latestGAD7}` : "N/A"}
            </div>
            {gad7Diff !== null ? (
              <span className={`text-[11px] font-bold flex items-center gap-0.5 ${gad7Diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                <TrendingDown className="w-3.5 h-3.5" />
                {gad7Diff >= 0 ? `${gad7Diff} pts reduction` : `+${Math.abs(gad7Diff)} pts increase`}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Take 2+ to see trend</span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Therapy Milestones</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{sharedNotes?.length || 0}</div>
            <span className="text-[11px] text-slate-500 font-medium">Documented Sessions</span>
          </div>
        </div>

        {/* Longitudinal Recharts Chart */}
        <div className="mb-8">
          <LongitudinalChart data={chartData} />
        </div>

        {/* Shared Session Notes & Homework Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Therapist Shared Session Notes & Exercises
            </h2>

            {sharedNotes && sharedNotes.length > 0 ? (
              <div className="space-y-4">
                {sharedNotes.map((note: any) => {
                  const therapistUser = note.therapist?.user;
                  const therapistName = therapistUser?.full_name || "Assigned Therapist";

                  return (
                    <div
                      key={note.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{therapistName}</span>
                        <span className="text-slate-400">{note.session_date}</span>
                      </div>

                      {note.shared_summary && (
                        <p className="text-slate-600 leading-relaxed">{note.shared_summary}</p>
                      )}

                      {note.homework_assigned && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                          <span className="font-bold text-teal-900 block mb-0.5">Assigned Practice / Homework:</span>
                          <span className="text-teal-800">{note.homework_assigned}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  After your clinical sessions, your therapist can share key takeaways and homework exercises here.
                </p>
              </div>
            )}
          </div>

          {/* Assessment Chronology Table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Assessment History
              </h2>
              <Link
                href="/patient/assessment"
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                + Retake
              </Link>
            </div>

            {assessmentList.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {assessmentList.slice().reverse().map((a: any) => (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{a.assessment_type}</div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(a.completed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900">Score: {a.total_score}</div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize bg-slate-100 text-slate-700">
                        {a.severity_band}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No assessments on record.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
