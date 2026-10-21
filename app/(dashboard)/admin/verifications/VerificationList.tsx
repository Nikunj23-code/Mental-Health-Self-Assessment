"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ShieldCheck, Clock, Award, Star } from "lucide-react";
import { verifyTherapist } from "@/server/actions/admin";

interface Therapist {
  id: string;
  license_number: string;
  is_verified: boolean;
  specializations: string[];
  years_of_experience: number;
  hourly_rate: number;
  bio?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface Props {
  initialTherapists: Therapist[];
}

export default function VerificationList({ initialTherapists }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const pending = initialTherapists.filter((t) => !t.is_verified);
  const verified = initialTherapists.filter((t) => t.is_verified);

  const displayed =
    filter === "pending"
      ? pending
      : filter === "verified"
      ? verified
      : initialTherapists;

  const handleToggleVerification = async (therapistId: string, newState: boolean) => {
    setLoadingId(therapistId);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await verifyTherapist(therapistId, newState);
      if (res.success) {
        setStatusMsg(
          newState
            ? "Therapist successfully verified and enabled for client matching."
            : "Therapist verification revoked."
        );
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update verification status.";
      setErrorMsg(msg);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" /> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "pending"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pending Review ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("verified")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "verified"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Verified Clinicians ({verified.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All ({initialTherapists.length})
        </button>
      </div>

      {displayed.length > 0 ? (
        <div className="space-y-4">
          {displayed.map((t) => {
            const name = t.user?.full_name || "Practitioner";
            const email = t.user?.email || "No email on record";

            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900">{name}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        t.is_verified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.is_verified ? "Verified" : "Pending Review"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      License: {t.license_number}
                    </span>
                    <span>{email}</span>
                    <span>•</span>
                    <span>{t.years_of_experience}+ yrs exp.</span>
                    <span>•</span>
                    <span>₹{t.hourly_rate} / session</span>
                  </div>

                  {t.specializations && t.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {t.bio && (
                    <p className="text-xs text-slate-600 pt-2 line-clamp-2 italic">
                      "{t.bio}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                  {!t.is_verified ? (
                    <button
                      type="button"
                      disabled={loadingId === t.id}
                      onClick={() => handleToggleVerification(t.id, true)}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 disabled:opacity-40 inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {loadingId === t.id ? "Approving..." : "Approve & Verify"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loadingId === t.id}
                      onClick={() => handleToggleVerification(t.id, false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-semibold rounded-xl text-xs transition border border-slate-200 disabled:opacity-40 inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      {loadingId === t.id ? "Updating..." : "Revoke Verification"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Therapists in this View</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All registered practitioners have been processed.
          </p>
        </div>
      )}
    </div>
  );
}
