import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Activity, ShieldCheck, Database } from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function AdminAuditPage() {
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
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Fetch audit logs
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      id,
      user_id,
      action,
      table_affected,
      record_id,
      metadata,
      ip_address,
      created_at,
      user:profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            HIPAA-Aligned Regulatory Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Append-only audit events recording appointment scheduling, therapist verifications, assessment submissions, and safety log resolutions.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Table</th>
                  <th className="px-6 py-3.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => {
                    const u = log.user;
                    const userName = u?.full_name || log.user_id?.slice(0, 8) || "System";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {userName}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-500">
                          {log.table_affected}
                        </td>
                        <td className="px-6 py-3 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                          {log.metadata ? JSON.stringify(log.metadata) : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
