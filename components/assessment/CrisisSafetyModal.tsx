'use client';

import React from 'react';
import { PhoneCall, ShieldAlert, Heart } from 'lucide-react';
import { EMERGENCY_RESOURCES } from '@/lib/clinical/crisis';

interface Props {
  isOpen: boolean;
  onAcknowledge?: () => void;
  onClose?: () => void;
}

export function CrisisSafetyModal({ isOpen, onAcknowledge, onClose }: Props) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onAcknowledge) onAcknowledge();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3.5 text-red-600 mb-4">
          <div className="p-2.5 rounded-2xl bg-red-50 border border-red-100">
            <ShieldAlert className="h-7 w-7 flex-shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Immediate Support Is Available</h2>
            <p className="text-xs text-red-600 font-semibold tracking-wide uppercase">Safety Priority Protocol</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
          Your responses indicate significant distress or thoughts of self-harm. You are never alone. Confidential, free support is immediately accessible right now:
        </p>

        <div className="space-y-3 mb-6">
          {EMERGENCY_RESOURCES.map((res) => (
            <div key={res.phone} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{res.name}</div>
                <div className="text-xs text-slate-500">{res.description}</div>
              </div>
              <a
                href={`tel:${res.phone.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm transition flex-shrink-0"
              >
                <PhoneCall className="h-3.5 w-3.5" /> {res.phone}
              </a>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
        >
          I Acknowledge & Wish to Continue
        </button>
      </div>
    </div>
  );
}

export default CrisisSafetyModal;
