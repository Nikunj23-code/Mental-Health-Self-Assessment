import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify role
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900">Restricted Administrator Area</h1>
            <p className="text-xs text-slate-500 mt-2">
              Your account ({profile?.full_name || user.email}) does not have administrative privileges.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch counts
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalTherapists } = await supabase
    .from("therapist_profiles")
    .select("*", { count: "exact", head: true });

  const { count: pendingTherapists } = await supabase
    .from("therapist_profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", false);

  const { count: totalAssessments } = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true });

  const { count: activeCrisisCount } = await supabase
    .from("crisis_logs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { count: totalAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true });

  // Fetch recent crisis logs
  const { data: recentCrisis } = await supabase
    .from("crisis_logs")
    .select(`
      id,
      patient_id,
      item_score,
      status,
      created_at,
      patient:profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch pending verifications
  const { data: pendingList } = await supabase
    .from("therapist_profiles")
    .select(`
      id,
      license_number,
      years_of_experience,
      created_at,
      user:profiles(full_name)
    `)
    .eq("is_verified", false)
    .limit(4);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            System Administration & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Command Center
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Monitor clinical safety lifelines, review therapist verification queues, inspect immutable audit trails, and oversee user activity.
          </p>
        </div>

        {/* High-level Platform Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Users</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers || 0}</div>
            <span className="text-[11px] text-teal-600 font-medium">Patients & Clinicians</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Verifications</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingTherapists || 0}</div>
            <Link
              href="/admin/verifications"
              className="text-[11px] text-amber-700 font-semibold hover:underline block"
            >
              Review Queue →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Assessments Run</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalAssessments || 0}</div>
            <span className="text-[11px] text-slate-500 font-medium">PHQ-9 & GAD-7</span>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm border ${
            (activeCrisisCount || 0) > 0
              ? "bg-rose-50 border-rose-200"
              : "bg-white border-slate-200"
          }`}>
            <span className="text-xs font-semibold text-rose-500 uppercase">Active Crisis Logs</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{activeCrisisCount || 0}</div>
            <Link
              href="/admin/crisis"
              className="text-[11px] text-rose-700 font-semibold hover:underline block"
            >
              Inspect Safety Events →
            </Link>
          </div>
        </div>

        {/* Quick Access Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/verifications"
            className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-teal-500 hover:shadow-md transition group"
          >
            <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl w-fit mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Clinician Verification</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Verify practitioner licenses, credentials, and activate therapist accounts for patient matching.
            </p>
            <span className="text-xs font-bold text-teal-600 inline-flex items-center gap-1">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/crisis"
            className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-rose-500 hover:shadow-md transition group"
          >
            <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl w-fit mb-3 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Crisis Intervention Logs</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Real-time audit log of all Item 9 triggers and clinical triage escalations requiring case notes.
            </p>
            <span className="text-xs font-bold text-rose-600 inline-flex items-center gap-1">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/audit"
            className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-slate-800 hover:shadow-md transition group"
          >
            <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl w-fit mb-3 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Immutable Audit Logs</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Tamper-evident system activity trail covering appointment bookings, notes creation, and access records.
            </p>
            <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Split Tables: Pending Verifications & Recent Crisis Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Verifications */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Pending Therapist Approvals
              </h2>
              <Link href="/admin/verifications" className="text-xs font-semibold text-teal-600 hover:underline">
                View All
              </Link>
            </div>

            {pendingList && pendingList.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {pendingList.map((t: any) => {
                  const u = t.user as any;
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{u?.full_name || "Clinician"}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">License: {t.license_number}</div>
                      </div>
                      <Link
                        href="/admin/verifications"
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg text-xs"
                      >
                        Review
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No pending therapist verifications.</p>
            )}
          </div>

          {/* Recent Crisis Logs */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Recent Crisis Events
              </h2>
              <Link href="/admin/crisis" className="text-xs font-semibold text-rose-600 hover:underline">
                View All
              </Link>
            </div>

            {recentCrisis && recentCrisis.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {recentCrisis.map((c: any) => {
                  const p = c.patient as any;
                  return (
                    <div key={c.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{p?.full_name || "Patient"}</div>
                        <div className="text-rose-600 font-semibold text-[11px] mt-0.5">
                          Item 9 Score: {c.item_score} • {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                        c.status === "open" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Zero crisis triggers recorded.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
