import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function TherapistDashboardPage() {
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
    .select(`
      id,
      license_number,
      is_verified,
      specializations,
      years_of_experience,
      hourly_rate,
      average_rating,
      user:profiles(full_name)
    `)
    .eq("user_id", user.id)
    .single();

  const therapistProfile = therapistProfileData as any;

  if (!therapistProfile) {
    redirect("/login");
  }

  const therapistUser = therapistProfile.user as any;
  const fullName = therapistUser?.full_name || "Doctor";

  // Fetch upcoming scheduled appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      start_time,
      end_time,
      status,
      meeting_link,
      patient_id,
      patient:profiles(full_name, id)
    `)
    .eq("therapist_id", therapistProfile.id)
    .in("status", ["scheduled", "confirmed"])
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(5);

  // Fetch recent open slots count
  const today = new Date().toISOString().split("T")[0];
  const { count: openSlotsCount } = await supabase
    .from("therapist_availability")
    .select("*", { count: "exact", head: true })
    .eq("therapist_id", therapistProfile.id)
    .eq("is_booked", false)
    .gte("slot_date", today);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Verification Warning if pending */}
        {!therapistProfile.is_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <span className="font-bold">Credential Verification in Progress:</span> Your license (
              <span className="font-mono font-bold">{therapistProfile.license_number}</span>) is awaiting admin verification. While pending, you will not appear in patient matching recommendations, but you can configure your clinical schedule and availability slots below.
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Clinical Practitioner Portal
              </span>
              {therapistProfile.is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Clinician
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Welcome, {fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage client appointments, review standardized MBC trajectory, and document SOAP clinical notes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/therapist/availability"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20"
            >
              <PlusCircle className="w-4 h-4" /> Manage Availability Slots
            </Link>
            <Link
              href="/therapist/patients"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-slate-900/20"
            >
              <Users className="w-4 h-4" /> Client Roster & MBC
            </Link>
          </div>
        </div>

        {/* Quick Clinical Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming Sessions</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{appointments?.length || 0}</div>
            <span className="text-[11px] text-teal-600 font-medium">Scheduled teleconsultations</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Open Slots</span>
            <div className="text-2xl font-black text-teal-800 mt-1">{openSlotsCount || 0}</div>
            <span className="text-[11px] text-slate-500 font-medium">Available for patient booking</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Consultation Fee</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{therapistProfile.hourly_rate}</div>
            <span className="text-[11px] text-slate-500 font-medium">Per 50-minute clinical session</span>
          </div>
        </div>

        {/* Upcoming Appointments List */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Scheduled Telehealth Sessions
            </h2>
            <Link
              href="/therapist/patients"
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              View All Patients →
            </Link>
          </div>

          {appointments && appointments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt: any) => {
                const patientUser = apt.patient;
                const patientName = patientUser?.full_name || "Patient";

                return (
                  <div
                    key={apt.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm">{patientName}</span>
                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {apt.meeting_link && (
                        <a
                          href={apt.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition inline-flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5 text-teal-600" /> Join Call
                        </a>
                      )}

                      <Link
                        href={`/therapist/sessions/${apt.id}`}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" /> Document SOAP Note
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No sessions scheduled currently</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Make sure you have added open slots to your availability calendar so clients can discover and book with you.
              </p>
              <Link
                href="/therapist/availability"
                className="inline-block mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition"
              >
                + Add Open Slots
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
