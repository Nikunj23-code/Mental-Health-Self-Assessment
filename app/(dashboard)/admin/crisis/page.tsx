import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import CrisisManager from "./CrisisManager";

export default async function AdminCrisisPage() {
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
    .select('id,role,full_name,preferred_language')
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Fetch all crisis logs
  const { data: crisisLogs } = await supabase
    .from("crisis_logs")
    .select(`
      id,
      patient_id,
      assessment_id,
      item_score,
      status,
      safety_plan_acknowledged,
      resolution_notes,
      created_at,
      resolved_at,
      patient:profiles(full_name)
    `)
    .order("created_at", { ascending: false });

  const {data:contacts}=await (supabase as any).rpc('admin_contact_profiles');
  const contactMap=new Map((contacts||[]).map((c:any)=>[c.id,c.email]));
  const logsWithContact=(crisisLogs||[]).map((c:any)=>({...c,patient:{...c.patient,email:contactMap.get(c.patient_id)||''}}));
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Zero-Latency Safety Surveillance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Crisis Incident Audit & Resolution
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            All PHQ-9 Item 9 triggers (thoughts of death or self-harm) are logged instantly in real time. Inspect safety plan acknowledgments and document resolution notes.
          </p>
        </div>

        <CrisisManager initialLogs={logsWithContact} />
      </div>
    </div>
  );
}
