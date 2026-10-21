import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Stethoscope, Video, Calendar, Clock, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SoapNoteForm from "./SoapNoteForm";

interface Props {
  params: Promise<{
    appointmentId: string;
  }>;
}

export default async function SessionDetailPage({ params }: Props) {
  const { appointmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch appointment with patient profile
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(`
      id,
      patient_id,
      therapist_id,
      appointment_date,
      start_time,
      end_time,
      status,
      meeting_link,
      patient:profiles(full_name, id)
    `)
    .eq("id", appointmentId)
    .single();

  if (error || !appointment) {
    notFound();
  }

  const apt = appointment as any;

  // Fetch existing session notes if any
  const { data: existingNote } = await supabase
    .from("session_notes")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  // Fetch patient's latest assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("patient_id", apt.patient_id)
    .order("completed_at", { ascending: false })
    .limit(3);

  const patient = apt.patient as any;
  const patientName = patient?.full_name || "Patient";

  const assessmentsList = (assessments || []) as any[];
  const latestPHQ9 = assessmentsList.find((a) => a.assessment_type === "PHQ-9");
  const latestGAD7 = assessmentsList.find((a) => a.assessment_type === "GAD-7");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/therapist/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Roster
        </Link>

        {/* Header Session Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Clinical Session Documentation
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                SOAP Note: {patientName}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {apt.appointment_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                </span>
                <span className="font-semibold capitalize text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {apt.status}
                </span>
              </div>
            </div>

            {apt.meeting_link && (
              <a
                href={apt.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition inline-flex items-center gap-2 self-start sm:self-center shadow-md shadow-slate-900/20"
              >
                <Video className="w-4 h-4 text-teal-400" /> Join Telehealth Session
              </a>
            )}
          </div>

          {/* Clinical Measurement Snapshot */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MBC Pre-Screen:</span>
            {latestPHQ9 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
                PHQ-9: {latestPHQ9.total_score}/27 ({latestPHQ9.severity_band})
                {latestPHQ9.crisis_flag && (
                  <span className="text-rose-600 font-bold ml-1">⚠️ Item 9 Flagged</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-slate-400">PHQ-9: Not taken</span>
            )}

            {latestGAD7 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                GAD-7: {latestGAD7.total_score}/21 ({latestGAD7.severity_band})
              </span>
            ) : (
              <span className="text-xs text-slate-400">GAD-7: Not taken</span>
            )}
          </div>
        </div>

        {/* SOAP Authoring Form */}
        <SoapNoteForm
          appointmentId={apt.id}
          patientId={apt.patient_id}
          existingNote={existingNote}
        />
      </main>
    </div>
  );
}
