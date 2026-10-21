import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  HeartPulse,
  Calendar,
  ClipboardList,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Video,
  CheckCircle2,
} from "lucide-react";
import ScoreResultCard from "@/components/assessment/ScoreResultCard";
import Navbar from "@/components/Navbar";

export default async function PatientDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch patient profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  // Fetch recent assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("patient_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(4);

  // Fetch upcoming appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      status,
      meeting_link,
      notes,
      therapist:therapist_profiles(
        id,
        specializations,
        user:profiles(full_name)
      )
    `)
    .eq("patient_id", user.id)
    .in("status", ["scheduled", "confirmed"])
    .order("appointment_date", { ascending: true })
    .limit(3);

  // Find latest PHQ-9 and GAD-7
  const assessmentList = (assessments || []) as any[];
  const latestPHQ9 = assessmentList.find((a) => a.assessment_type === "PHQ-9");
  const latestGAD7 = assessmentList.find((a) => a.assessment_type === "GAD-7");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Measurement-Based Care Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name || "there"}
            </h1>
            <p className="text-slate-200 text-sm mt-2 leading-relaxed">
              Track your emotional well-being using clinically validated assessment scales,
              receive transparent therapist recommendations, and monitor your longitudinal recovery.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/patient/assessment"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md"
              >
                <ClipboardList className="w-4 h-4" />
                Take Clinical Assessment
              </Link>
              <Link
                href="/patient/match"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm backdrop-blur-md transition-all border border-white/10"
              >
                Find Recommended Therapists
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Crisis Hotline Alert Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <span className="font-bold">Need immediate assistance?</span> If you are in distress or having thoughts of self-harm, confidential free help is available 24/7. Call Tele-MANAS (India) at{" "}
            <a href="tel:14416" className="font-bold underline text-amber-950">14416</a> or{" "}
            <a href="tel:18008914416" className="font-bold underline text-amber-950">1800 891 4416</a>, KIRAN at{" "}
            <a href="tel:18005990019" className="font-bold underline text-amber-950">1800-599-0019</a>, or US Lifeline at{" "}
            <a href="tel:988" className="font-bold underline text-amber-950">988</a>.
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Clinical Overview & Recent Assessments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                Latest Clinical Profile
              </h2>
              <Link
                href="/patient/progress"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Full Longitudinal Progress
              </Link>
            </div>

            {latestPHQ9 || latestGAD7 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestPHQ9 ? (
                  <ScoreResultCard
                    assessmentType="PHQ-9"
                    totalScore={latestPHQ9.total_score}
                    severityBand={latestPHQ9.severity_band}
                    crisisFlag={latestPHQ9.crisis_flag}
                    completedAt={latestPHQ9.completed_at}
                  />
                ) : (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-slate-500 font-medium">No PHQ-9 Depression assessment completed yet.</p>
                    <Link
                      href="/patient/assessment/phq9"
                      className="inline-block mt-3 text-xs font-semibold text-teal-600 hover:underline"
                    >
                      Take PHQ-9 (9 Questions) →
                    </Link>
                  </div>
                )}

                {latestGAD7 ? (
                  <ScoreResultCard
                    assessmentType="GAD-7"
                    totalScore={latestGAD7.total_score}
                    severityBand={latestGAD7.severity_band}
                    crisisFlag={latestGAD7.crisis_flag}
                    completedAt={latestGAD7.completed_at}
                  />
                ) : (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-slate-500 font-medium">No GAD-7 Anxiety assessment completed yet.</p>
                    <Link
                      href="/patient/assessment/gad7"
                      className="inline-block mt-3 text-xs font-semibold text-teal-600 hover:underline"
                    >
                      Take GAD-7 (7 Questions) →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">You haven't completed any assessments yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Complete the standard PHQ-9 or GAD-7 screenings to generate your clinical severity profile and unlock personalized, weighted therapist matching.
                </p>
                <Link
                  href="/patient/assessment"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all inline-flex items-center gap-2"
                >
                  Start First Assessment <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Assessment History Preview */}
            {assessmentList.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Assessments</h3>
                <div className="divide-y divide-slate-100">
                  {assessmentList.map((a: any) => (
                    <div key={a.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-slate-800">{a.assessment_type}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                          Score: {a.total_score}
                        </span>
                        <span className="text-slate-500 text-xs capitalize">({a.severity_band})</span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {new Date(a.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Upcoming Sessions & Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Upcoming Sessions
                </h2>
                <Link
                  href="/patient/match"
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  + Book Slot
                </Link>
              </div>

              {appointments && appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt: any) => {
                    const therapistUser = apt.therapist?.user;
                    const therapistName = therapistUser?.full_name || "Assigned Therapist";

                    return (
                      <div
                        key={apt.id}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {therapistName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            <CheckCircle2 className="w-3 h-3" /> {apt.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {apt.appointment_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                          </span>
                        </div>

                        {apt.meeting_link && (
                          <div className="pt-1">
                            <a
                              href={apt.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" /> Join Telehealth Session
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 mb-3">No upcoming sessions booked.</p>
                  <Link
                    href="/patient/match"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    Find a Therapist & Book
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm tracking-tight">Need Support?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                MindAlign’s explainable matching matches your specific severity tier with licensed psychologists and psychiatrists.
              </p>
              <div className="pt-2">
                <Link
                  href="/patient/match"
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all inline-flex items-center justify-center gap-1.5"
                >
                  Explore Therapist Matches →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
