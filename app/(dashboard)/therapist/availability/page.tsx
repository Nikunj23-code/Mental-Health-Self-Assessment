import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, Plus, Clock, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvailabilityManager from "./AvailabilityManager";

export default async function TherapistAvailabilityPage() {
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

  // Fetch all availability slots
  const today = new Date().toISOString().split("T")[0];
  const { data: slots } = await supabase
    .from("therapist_availability")
    .select("*")
    .eq("therapist_id", therapistProfile.id)
    .gte("slot_date", today)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/therapist"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Practice Schedule Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Availability & Appointment Slots
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Publish consultation openings for prospective clients. MindAlign automatically updates your availability score in real time.
          </p>
        </div>

        <AvailabilityManager initialSlots={slots || []} />
      </main>
    </div>
  );
}
