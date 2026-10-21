import React from 'react';
import Link from 'next/link';
import { ScoreResult } from '@/lib/clinical/scoring';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  type?: string;
  result?: ScoreResult;
  assessmentType?: string;
  totalScore?: number;
  severityBand?: string;
  crisisFlag?: boolean;
  completedAt?: string;
}

export function ScoreResultCard({
  type,
  result,
  assessmentType,
  totalScore,
  severityBand,
  crisisFlag,
  completedAt,
}: Props) {
  const displayType = assessmentType || type || 'Assessment';
  const score = totalScore !== undefined ? totalScore : result?.totalScore ?? 0;
  const severity = severityBand || result?.severityLabel || 'Minimal';
  const hasCrisis = crisisFlag !== undefined ? crisisFlag : result?.hasCrisisFlag ?? false;
  const recommendation = result?.clinicalRecommendation || `Your ${displayType} score places you in the ${severity.toLowerCase()} symptom category. Regular longitudinal tracking is clinically recommended.`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            {displayType} Assessment Result
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 capitalize">{severity} Symptoms</h2>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3">
          <div className="text-3xl font-black text-slate-900">{score}</div>
          <div className="text-xs text-slate-500 font-medium leading-tight">
            Total<br />Score
          </div>
        </div>
      </div>

      <div className="py-6">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Clinical Care Guidance</h4>
        <p className="text-slate-700 text-sm leading-relaxed font-normal">{recommendation}</p>

        {hasCrisis && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>
              Your responses indicated self-harm or crisis ideation. Immediate 24/7 confidential support is available via Tele-MANAS (14416) or 988.
            </span>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          <span>Longitudinal score timestamped in your health records.</span>
        </div>

        <Link
          href="/patient/match"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition"
        >
          <span>Find Matched Therapists</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default ScoreResultCard;
