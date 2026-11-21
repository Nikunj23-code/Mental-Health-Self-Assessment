import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import VerificationList from "./VerificationList";

export default async function AdminVerificationsPage() {
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

  // Fetch all therapists
  const { data: therapists } = await supabase
    .from("therapist_profiles")
    .select(`
      id,
      license_number,
      is_verified,
      specialties,
      experience_years,
      hourly_rate,
      bio,
      created_at,
      profiles(full_name)
    `)
    .order("created_at", { ascending: false });

  const {data:contacts}=await (supabase as any).rpc('admin_contact_profiles');
  const contactMap=new Map((contacts||[]).map((c:any)=>[c.id,c.email]));
  const therapistsWithContact=(therapists||[]).map((t:any)=>({...t,profiles:{...t.profiles,email:contactMap.get(t.id)||''}}));
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
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Clinical Credential Auditing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Therapist Verification Queue
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Verify state medical licenses, registration numbers, and clinical specialties to activate therapists for client matching and appointments.
          </p>
        </div>

        <VerificationList initialTherapists={therapistsWithContact} />
      </div>
    </div>
  );
}
