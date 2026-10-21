"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSessionNotes } from "@/server/actions/session-notes";
import { CheckCircle2, ShieldCheck, Share2, Save, FileText } from "lucide-react";

interface Props {
  appointmentId: string;
  patientId: string;
  existingNote?: any;
}

export default function SoapNoteForm({ appointmentId, patientId, existingNote }: Props) {
  const router = useRouter();

  const [subjective, setSubjective] = useState(existingNote?.subjective_notes || "");
  const [objective, setObjective] = useState(existingNote?.objective_observations || "");
  const [assessment, setAssessment] = useState(existingNote?.assessment_diagnosis || "");
  const [plan, setPlan] = useState(existingNote?.plan_homework || "");
  const [moodRating, setMoodRating] = useState<number>(existingNote?.mood_rating || 5);
  const [riskAssessment, setRiskAssessment] = useState<string>(
    existingNote?.risk_assessment || "Low risk; no acute suicidal or homicidal ideation reported."
  );
  const [isShared, setIsShared] = useState<boolean>(existingNote?.is_shared_with_patient ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      const res = await recordSessionNotes({
        appointmentId,
        patientId,
        subjectiveNotes: subjective,
        objectiveObservations: objective,
        assessmentDiagnosis: assessment,
        planHomework: plan,
        moodRating,
        riskAssessment,
        isSharedWithPatient: isShared,
      });

      if (res.success) {
        setStatusMsg("Session note successfully saved and appointment marked as completed.");
        setTimeout(() => {
          router.push("/therapist/patients");
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record session notes.";
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* S: Subjective */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-teal-700">
          S — Subjective (Patient Report & Narrative)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Client’s description of current mood, presenting concerns, triggers, and events since last session.
        </p>
        <textarea
          rows={3}
          required
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Client reports feeling persistent exhaustion, mild sleep disturbance, and increased worry regarding upcoming professional deadlines..."
          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {/* O: Objective */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-teal-700">
          O — Objective (Clinical Observations)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Behavioral observations, affect, eye contact, psychomotor agitation/retardation, and communication flow.
        </p>
        <textarea
          rows={3}
          required
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Affect congruent with mood, slightly anxious; eye contact appropriate; speech normal rate and rhythm; alert and oriented x4..."
          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {/* A: Assessment */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-teal-700">
          A — Assessment (Clinical Impression & Progress)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Clinical synthesis of client state, response to prior interventions, and symptom alignment with PHQ-9 / GAD-7.
        </p>
        <textarea
          rows={3}
          required
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
          placeholder="Progressing well with cognitive reframing techniques; symptoms consistent with moderate generalised anxiety disorder with positive treatment response..."
          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {/* P: Plan */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-teal-700">
          P — Plan & Assigned Exercises (Shared with Client)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Therapeutic plan for next session, behavioral activation tasks, or homework for the client.
        </p>
        <textarea
          rows={3}
          required
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="Continue 5-4-3-2-1 grounding exercise daily; complete 3 automatic thought records; schedule follow-up session next week..."
          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {/* Vitals: Mood Rating & Risk Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Session Mood Rating (1 to 10)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              value={moodRating}
              onChange={(e) => setMoodRating(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <span className="font-mono font-bold text-sm text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              {moodRating}/10
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Risk & Safety Assessment
          </label>
          <input
            type="text"
            required
            value={riskAssessment}
            onChange={(e) => setRiskAssessment(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Privacy & Sharing Toggle */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Share2 className="w-4 h-4 text-teal-700" />
          <div>
            <span className="text-xs font-bold text-teal-900 block">
              Share Treatment Plan & Exercises with Patient
            </span>
            <span className="text-[11px] text-teal-700">
              Only the Plan & Homework section will be visible on the client's progress dashboard. Subjective/Objective notes remain strictly private.
            </span>
          </div>
        </div>

        <input
          type="checkbox"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
          className="w-4 h-4 text-teal-600 rounded accent-teal-600 cursor-pointer"
        />
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 disabled:opacity-40 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving Documentation..." : "Save SOAP Clinical Note"}
        </button>
      </div>
    </form>
  );
}
