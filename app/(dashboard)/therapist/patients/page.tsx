import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Users, AlertTriangle, FileText, HeartPulse, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function TherapistPatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch therapist profile
  const { data: therapistProfileData } = await supabase
    .from("therapist_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const therapistProfile = therapistProfileData as any;

  if (!therapistProfile) {
    redirect("/login");
  }

  // Fetch all appointments for this therapist
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      appointment_date,
      start_time,
      status,
      patient:profiles(id, full_name, role)
    `)
    .eq("therapist_id", therapistProfile.id)
    .order("appointment_date", { ascending: false });

  // Get distinct patients
  const patientMap: Record<string, any> = {};
  appointments?.forEach((apt: any) => {
    if (apt.patient && !patientMap[apt.patient_id]) {
      patientMap[apt.patient_id] = {
        patientId: apt.patient_id,
        fullName: apt.patient.full_name,
        latestAppointment: apt,
        sessionCount: 0,
      };
    }
    if (patientMap[apt.patient_id]) {
      patientMap[apt.patient_id].sessionCount += 1;
    }
  });

  const patientIds = Object.keys(patientMap);

  // Fetch latest assessments for these patients
  let assessmentMap: Record<string, { phq9?: any; gad7?: any }> = {};

  if (patientIds.length > 0) {
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*")
      .in("patient_id", patientIds)
      .order("completed_at", { ascending: false });

    const assessmentList = (assessments || []) as any[];
    assessmentList.forEach((a: any) => {
      if (!assessmentMap[a.patient_id]) {
        assessmentMap[a.patient_id] = {};
      }
      if (a.assessment_type === "PHQ-9" && !assessmentMap[a.patient_id].phq9) {
        assessmentMap[a.patient_id].phq9 = a;
      }
      if (a.assessment_type === "GAD-7" && !assessmentMap[a.patient_id].gad7) {
        assessmentMap[a.patient_id].gad7 = a;
      }
    });
  }

  const patientList = Object.values(patientMap);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/therapist"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Longitudinal Measurement-Based Care (MBC)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Assigned Patient Roster
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Monitor client clinical trajectories, review standardized PHQ-9 & GAD-7 scores before sessions, and identify safety flags.
          </p>
        </div>

        {patientList.length > 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {patientList.map((p: any) => {
                const clinicalData = assessmentMap[p.patientId];
                const phq9 = clinicalData?.phq9;
                const gad7 = clinicalData?.gad7;
                const hasCrisis = phq9?.crisis_flag;

                return (
                  <div key={p.patientId} className="p-6 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-slate-900 text-base">{p.fullName}</h3>
                          {hasCrisis && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Crisis Flag (Item 9)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Total Sessions: <strong className="text-slate-700">{p.sessionCount}</strong></span>
                          <span>•</span>
                          <span>Latest Session: <strong className="text-slate-700">{p.latestAppointment.appointment_date}</strong></span>
                        </div>
                      </div>

                      {/* Clinical Scores Summary */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs min-w-[130px]">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Depression (PHQ-9)</span>
                          {phq9 ? (
                            <div className="mt-0.5 flex items-center justify-between">
                              <span className="font-extrabold text-teal-800 text-sm">{phq9.total_score} / 27</span>
                              <span className="text-[10px] font-semibold text-slate-600 capitalize">({phq9.severity_band})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Not taken</span>
                          )}
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs min-w-[130px]">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Anxiety (GAD-7)</span>
                          {gad7 ? (
                            <div className="mt-0.5 flex items-center justify-between">
                              <span className="font-extrabold text-blue-800 text-sm">{gad7.total_score} / 21</span>
                              <span className="text-[10px] font-semibold text-slate-600 capitalize">({gad7.severity_band})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Not taken</span>
                          )}
                        </div>

                        <Link
                          href={`/therapist/sessions/${p.latestAppointment.id}`}
                          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> SOAP Note
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Clients Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              When patients book appointments from your open availability slots, their profiles and longitudinal assessment trajectories will appear here automatically.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
