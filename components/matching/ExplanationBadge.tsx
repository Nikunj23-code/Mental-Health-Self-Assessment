import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface Props {
  explanation: string;
}

export function ExplanationBadge({ explanation }: Props) {
  return (
    <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100/90 text-teal-950 text-xs leading-relaxed flex items-start gap-2.5">
      <Sparkles className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-bold text-teal-900 block mb-0.5">Why this therapist was recommended:</span>
        <span className="text-slate-700">{explanation}</span>
      </div>
    </div>
  );
}
