import React from 'react';
import Link from 'next/link';
import { MatchResult } from '@/lib/matching/engine';
import { ExplanationBadge } from './ExplanationBadge';
import { Calendar, Clock, Star, ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  match: MatchResult;
}

export function TherapistMatchCard({ match }: Props) {
  const { therapist, totalMatchScore, explanation, rank } = match;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold text-lg">
            {therapist.fullName.replace('Dr. ', '').replace('Ms. ', '').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{therapist.fullName}</h3>
              <ShieldCheck className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-xs text-slate-500 font-medium">{therapist.title}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>{therapist.averageRating.toFixed(2)}</span>
                <span className="text-slate-400 font-normal">({therapist.totalReviews})</span>
              </div>
              <span className="text-slate-300">•</span>
              <span>{therapist.experienceYears}+ years exp.</span>
              <span className="text-slate-300">•</span>
              <span>{therapist.languages.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match Score</div>
          <div className="flex items-center gap-1 text-2xl font-black text-teal-800">
            <span>{totalMatchScore}%</span>
          </div>
          <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
            Rank #{rank} Match
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 my-4">
        {therapist.specialties.map((spec) => (
          <span
            key={spec}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs"
          >
            {spec}
          </span>
        ))}
      </div>

      <div className="mb-5">
        <ExplanationBadge explanation={explanation} />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs text-slate-600 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>₹{therapist.hourlyRate} / 50 min</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
            <Calendar className="h-4 w-4" />
            <span>{therapist.unbookedSlotsCount} slots open</span>
          </div>
        </div>

        <Link
          href={`/patient/book/${therapist.therapistId}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition"
        >
          <span>Book Session</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
