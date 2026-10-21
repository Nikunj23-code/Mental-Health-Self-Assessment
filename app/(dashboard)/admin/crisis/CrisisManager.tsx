"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, Check } from "lucide-react";
import { resolveCrisis } from "@/server/actions/admin";

interface CrisisLog {
  id: string;
  patient_id: string;
  item_score: number;
  status: string;
  safety_plan_acknowledged: boolean;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  patient?: {
    full_name: string;
    email: string;
  };
}

interface Props {
  initialLogs: CrisisLog[];
}

export default function CrisisManager({ initialLogs }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const openLogs = initialLogs.filter((l) => l.status === "open");
  const resolvedLogs = initialLogs.filter((l) => l.status === "resolved");

  const displayed =
    filter === "open"
      ? openLogs
      : filter === "resolved"
      ? resolvedLogs
      : initialLogs;

  const handleResolve = async (id: string) => {
    if (!notes.trim()) {
      setErrorMsg("Please enter clinical resolution notes before marking resolved.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await resolveCrisis(id, notes);
      if (res.success) {
        setResolvingId(null);
        setNotes("");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve incident.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setFilter("open")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "open"
              ? "bg-white text-rose-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Active Open ({openLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "resolved"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Resolved ({resolvedLogs.length})
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
          All Events ({initialLogs.length})
        </button>
      </div>

      {displayed.length > 0 ? (
        <div className="space-y-4">
          {displayed.map((c) => {
            const patientName = c.patient?.full_name || "Patient";
            const patientEmail = c.patient?.email || "No email on record";
            const isOpen = c.status === "open";

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl ${isOpen ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{patientName}</h3>
                      <p className="text-xs text-slate-500">{patientEmail}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase w-fit ${
                      isOpen
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Item 9 Rating</span>
                    <span className="font-bold text-rose-700">
                      Score {c.item_score} / 3 ({c.item_score === 1 ? "Several days" : c.item_score === 2 ? "More than half" : "Nearly every day"})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Safety Plan Shown</span>
                    <span className="font-medium text-slate-700">
                      {c.safety_plan_acknowledged ? "✓ Acknowledged by User" : "Modal displayed"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Triggered Timestamp</span>
                    <span className="font-medium text-slate-700">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {c.resolution_notes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">Resolution Notes:</span>
                    <p>{c.resolution_notes}</p>
                    {c.resolved_at && (
                      <span className="text-[11px] text-slate-400 block">
                        Resolved on {new Date(c.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Resolution Form Toggle */}
                {isOpen && (
                  <div className="pt-2 border-t border-slate-100">
                    {resolvingId === c.id ? (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-800">
                          Document Clinical Follow-Up / Action Plan:
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Telehealth counselor contacted user; safety plan reaffirmed; follow-up scheduled..."
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingId(null);
                              setNotes("");
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleResolve(c.id)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-40"
                          >
                            {isSubmitting ? "Saving..." : "Mark Incident Resolved"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingId(c.id);
                          setNotes("");
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Resolve Incident & Record Notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Crisis Incidents in this View</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Zero active safety escalations require intervention.
          </p>
        </div>
      )}
    </div>
  );
}
