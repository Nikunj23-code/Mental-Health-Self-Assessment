"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Video, CheckCircle2, ArrowRight } from "lucide-react";
import { bookAppointment } from "@/server/actions/booking";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Props {
  therapistId: string;
  therapistName: string;
  slots: Slot[];
}

export default function BookingForm({ therapistId, therapistName, slots }: Props) {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successApt, setSuccessApt] = useState<{
    appointmentId: string;
    slotDate: string;
    startTime: string;
  } | null>(null);

  // Group slots by date
  const slotsByDate: Record<string, Slot[]> = {};
  slots.forEach((s) => {
    if (!slotsByDate[s.slot_date]) {
      slotsByDate[s.slot_date] = [];
    }
    slotsByDate[s.slot_date].push(s);
  });

  const dates = Object.keys(slotsByDate).sort();
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || "");

  const activeSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleBook = async () => {
    if (!selectedSlotId || !selectedSlot) {
      setErrorMsg("Please select an available time slot.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await bookAppointment(therapistId, selectedSlotId);
      if (res.success) {
        setSuccessApt({
          appointmentId: res.appointmentId,
          slotDate: selectedSlot.slot_date,
          startTime: selectedSlot.start_time,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking failed.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successApt) {
    return (
      <div className="bg-white border border-teal-200 rounded-3xl p-8 sm:p-10 text-center shadow-lg shadow-teal-50">
        <span className="p-4 bg-teal-500 text-white rounded-full inline-flex mb-4 shadow-md shadow-teal-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Appointment Confirmed!
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Your telehealth clinical session with <span className="font-semibold text-slate-800">{therapistName}</span> is locked into the schedule.
        </p>

        <div className="my-6 max-w-sm mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-bold text-slate-800">{successApt.slotDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Time</span>
            <span className="font-bold text-slate-800">{successApt.startTime.slice(0, 5)} (50 Mins)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Modality</span>
            <span className="font-semibold text-teal-700 flex items-center gap-1">
              <Video className="w-3.5 h-3.5" /> MindAlign Secure Telehealth
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/patient"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 inline-flex items-center gap-2"
          >
            Go to Patient Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-teal-600" />
        Select an Appointment Slot
      </h2>

      {errorMsg && (
        <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {dates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No open availability slots found for this therapist at this time.</p>
          <Link
            href="/patient/match"
            className="inline-block mt-3 text-xs font-semibold text-teal-600 hover:underline"
          >
            ← Choose Another Therapist
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Date Selector Pills */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Available Dates
            </label>
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedSlotId("");
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedDate === d
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {new Date(d).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Radio Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Available Times on {selectedDate}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeSlots.map((s) => {
                const isSelected = selectedSlotId === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedSlotId(s.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-teal-50 border-teal-600 text-teal-900 font-bold ring-2 ring-teal-600/20"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-medium"
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking Summary & Submit Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 w-full sm:w-auto">
              {selectedSlot ? (
                <p>
                  Selected: <span className="font-bold text-slate-800">{selectedSlot.slot_date}</span> at{" "}
                  <span className="font-bold text-slate-800">{selectedSlot.start_time.slice(0, 5)}</span>
                </p>
              ) : (
                <p>Please select a time slot above.</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleBook}
              disabled={isSubmitting || !selectedSlotId}
              className="w-full sm:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Locking Slot..." : "Confirm & Book Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
