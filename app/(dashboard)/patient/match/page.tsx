import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Sparkles, SlidersHorizontal, AlertCircle, Info } from "lucide-react";
import { rankTherapists, MatchingCandidate, PatientCriteria } from "@/lib/matching/engine";
import { TherapistMatchCard } from "@/components/matching/TherapistMatchCard";

export default async function TherapistMatchingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch patient profile
  const { data: profile } = await supabase
    .from("profiles")
    .select('id,role,full_name,preferred_language')
    .eq("id", user.id)
    .single();

  // Fetch recent assessments for this patient
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  const assessmentList = (assessments || []) as any[];
  const latestPHQ9 = assessmentList.find((a) => a.type === "PHQ-9");
  const latestGAD7 = assessmentList.find((a) => a.type === "GAD-7");

  // Fetch all verified therapists with profile data
  const { data: therapistData } = await supabase
    .from("therapist_profiles")
    .select(`
      id,
      title,
      bio,
      license_number,
      specialties,
      experience_years,
      hourly_rate,
      average_rating,
      total_reviews,
      languages,
      profiles(full_name, avatar_url)
    `)
    .eq("is_verified", true);

  // Fetch unbooked slots count per therapist
  const nowIST = new Date().toLocaleString('sv-SE',{timeZone:'Asia/Kolkata'}).replace(' ','T');
  const today = nowIST.slice(0,10);
  const { data: slots } = await supabase
    .from("therapist_availability")
    .select("therapist_id,slot_date,start_time")
    .eq("is_booked", false)
    .gte("slot_date", today);

  const slotCountMap: Record<string, number> = {};
  (slots as any[] | null)?.forEach((s: any) => {
    if((s.slot_date+'T'+s.start_time)>=nowIST) slotCountMap[s.therapist_id]=(slotCountMap[s.therapist_id]||0)+1;
  });

  // Prepare criteria
  const criteria: PatientCriteria = {
    patientId: user.id,
    phq9Score: latestPHQ9?.total_score,
    phq9Severity: latestPHQ9?.severity,
    gad7Score: latestGAD7?.total_score,
    gad7Severity: latestGAD7?.severity,
    preferredLanguage: (profile as any)?.preferred_language || "English",
  };

  // Build candidate list
  const severe = latestPHQ9?.severity === 'severe' || latestGAD7?.severity === 'severe';
  const eligibleTherapists = ((therapistData || []) as any[]).filter((t:any) => !severe || /clinical psychologist|psychiatrist/i.test(t.title||''));
  const candidates: MatchingCandidate[] = eligibleTherapists.map((t: any) => {
    const fullName = t.profiles?.full_name || "Licensed Therapist";
    const title = t.title || (fullName.startsWith("Dr.") ? "Clinical Psychologist / Psychiatrist" : "Licensed Mental Health Counselor");

    return {
      therapistId: t.id,
      fullName,
      title,
      specialties: t.specialties || ["General Counseling"],
      experienceYears: t.experience_years ?? 0,
      hourlyRate: Number(t.hourly_rate ?? 0),
      averageRating: t.total_reviews > 0 ? Number(t.average_rating ?? 0) : 0,
      totalReviews: Number(t.total_reviews ?? 0),
      languages: t.languages || ["English", "Hindi"],
      unbookedSlotsCount: slotCountMap[t.id] || 0,
      gender: undefined,
    };
  });

  // Execute ranking algorithm
  const hasAssessment = Boolean(latestPHQ9 || latestGAD7);
  const matches = hasAssessment ? rankTherapists(candidates, criteria) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            href="/patient"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Explainable AI (XAI) Recommendation Engine
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Recommended Therapists
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Ranked using our deterministic 5-factor weighted algorithm based on your clinical assessment results, clinical specialty suitability, and real-time appointment availability.
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Profile Summary Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Matching Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {latestPHQ9 ? `PHQ-9: ${latestPHQ9.total_score} (${latestPHQ9.severity})` : "PHQ-9: Not taken"} •{" "}
                {latestGAD7 ? `GAD-7: ${latestGAD7.total_score} (${latestGAD7.severity})` : "GAD-7: Not taken"}
              </p>
            </div>
          </div>

          {(!latestPHQ9 && !latestGAD7) && (
            <Link
              href="/patient/assessment"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition shadow-sm inline-flex items-center gap-1.5 self-start sm:self-center"
            >
              Take Assessment for Precision Matches →
            </Link>
          )}
        </div>

        {/* Explainability Breakdown Pill */}
        <div className="bg-slate-100/80 rounded-xl p-3 mb-6 text-xs text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Scoring Weights:</strong> Specialty Fit (35%) + Severity Acuity (25%) + Real-time Slot Availability (20%) + Peer Review Rating (10%) + User Preferences (10%).
          </span>
        </div>

        {/* Ranked Match Cards */}
        {!hasAssessment ? (
          <div className="rounded-3xl border border-teal-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Your personal matches start with an assessment</h2>
            <p className="mx-auto my-4 max-w-lg text-sm text-slate-600">Complete a screening to create a transparent matching profile. We never invent a personal match score before you have assessment data.</p>
            <Link href="/patient/assessment" className="inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white">Start an assessment</Link>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-6">
            {matches.map((m) => (
              <TherapistMatchCard key={m.therapist.therapistId} match={m} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Verified Therapists Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Our clinical verification team is currently vetting newly onboarded practitioners. Please check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
