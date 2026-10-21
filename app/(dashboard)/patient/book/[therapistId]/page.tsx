import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ShieldCheck, Star, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import BookingForm from "./BookingForm";

interface Props {
  params: Promise<{
    therapistId: string;
  }>;
}

export default async function BookTherapistPage({ params }: Props) {
  const { therapistId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch therapist details
  const { data: therapist, error } = await supabase
    .from("therapist_profiles")
    .select(`
      id,
      title,
      license_number,
      specialties,
      experience_years,
      hourly_rate,
      average_rating,
      total_reviews,
      bio,
      profiles(full_name, avatar_url)
    `)
    .eq("id", therapistId)
    .single();

  if (error || !therapist) {
    notFound();
  }

  const therapistObj = therapist as any;
  const fullName = therapistObj.profiles?.full_name || therapistObj.title || "Licensed Practitioner";

  // Fetch open slots
  const today = new Date().toISOString().split("T")[0];
  const { data: slots } = await supabase
    .from("therapist_availability")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("is_booked", false)
    .gte("slot_date", today)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/patient/match"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Recommendations
        </Link>

        {/* Therapist Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-start gap-6">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold text-2xl shadow-md shadow-teal-700/20">
            {fullName.replace("Dr. ", "").replace("Ms. ", "").slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {fullName}
              </h1>
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              License: <span className="font-mono text-slate-700">{therapistObj.license_number}</span> • Verified
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1 font-bold text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{Number(therapistObj.average_rating || 4.9).toFixed(2)}</span>
                <span className="text-slate-400 font-normal">({therapistObj.total_reviews || 10} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-teal-600" />
                <span>{therapistObj.experience_years || 5}+ Years Experience</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-800">₹{therapistObj.hourly_rate} / 50 min session</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {(therapistObj.specialties || ["General Counseling"]).map((spec: string) => (
                <span
                  key={spec}
                  className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-semibold text-[11px] border border-teal-100"
                >
                  {spec}
                </span>
              ))}
            </div>

            {therapistObj.bio && (
              <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                "{therapistObj.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Slot Selector & Booking Action */}
        <BookingForm
          therapistId={therapistObj.id}
          therapistName={fullName}
          slots={slots || []}
        />
      </main>
    </div>
  );
}
