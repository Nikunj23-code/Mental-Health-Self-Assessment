'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ScaleOption {
  value: number;
  label: string;
}

interface QuestionProps {
  index?: number;
  questionNumber?: number;
  totalQuestions?: number;
  questionKey?: string;
  text?: string;
  questionText?: string;
  instruction?: string;
  isCrisisTrigger?: boolean;
  options: ScaleOption[];
  selectedValue?: number;
  onChange?: (value: number) => void;
  onSelect?: (value: number) => void;
}

export function AdaptiveQuestionCard({
  index,
  questionNumber,
  questionKey,
  text,
  questionText,
  instruction,
  isCrisisTrigger,
  options,
  selectedValue,
  onChange,
  onSelect,
}: QuestionProps) {
  const displayIndex = questionNumber !== undefined ? questionNumber : index ?? 1;
  const displayText = questionText || text || '';
  const handleChange = (val: number) => {
    if (onSelect) onSelect(val);
    if (onChange) onChange(val);
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-3xl border transition ${
        isCrisisTrigger && selectedValue !== undefined && selectedValue > 0
          ? 'bg-red-50/50 border-red-300'
          : selectedValue !== undefined
          ? 'bg-white border-teal-200 shadow-sm'
          : 'bg-white border-slate-200'
      }`}
    >
      {instruction && (
        <p className="text-xs text-slate-400 font-medium mb-3 italic">
          {instruction}
        </p>
      )}

      <div className="flex items-start gap-3.5 mb-5">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800 font-bold text-xs border border-teal-100">
          {displayIndex}
        </span>
        <div className="flex-1">
          <p className="text-slate-900 font-semibold text-base leading-relaxed">{displayText}</p>
          {isCrisisTrigger && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-700 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Safety Priority Item</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              className={`py-3 px-4 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between border ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                }`}
              >
                {opt.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AdaptiveQuestionCard;
