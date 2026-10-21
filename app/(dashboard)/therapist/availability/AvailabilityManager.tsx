"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { addAvailabilitySlot, deleteAvailabilitySlot } from "@/server/actions/availability";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Props {
  initialSlots: Slot[];
}

export default function AvailabilityManager({ initialSlots }: Props) {
  const router = useRouter();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");

  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
      const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

      const res = await addAvailabilitySlot(date, formattedStartTime, formattedEndTime);
      if (res.success) {
        setSuccessMsg(`Slot for ${date} (${startTime} - ${endTime}) added successfully!`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add slot.";
      setErrorMsg(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingId(slotId);
    setErrorMsg("");

    try {
      const res = await deleteAvailabilitySlot(slotId);
      if (res.success) {
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete slot.";
      setErrorMsg(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Add New Slot Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm h-fit">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-teal-600" />
          Add Consultation Slot
        </h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleAddSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Consultation Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAdding}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-teal-600/20 disabled:opacity-50 mt-2"
          >
            {isAdding ? "Publishing..." : "+ Add to Schedule"}
          </button>
        </form>
      </div>

      {/* Right Column (2 cols): Published Slots List */}
      <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            Scheduled Availability ({initialSlots.length})
          </h2>
          <span className="text-xs text-slate-500">
            {initialSlots.filter((s) => !s.is_booked).length} Available •{" "}
            {initialSlots.filter((s) => s.is_booked).length} Booked
          </span>
        </div>

        {initialSlots.length > 0 ? (
          <div className="space-y-3">
            {initialSlots.map((slot) => (
              <div
                key={slot.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {slot.slot_date}
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                      slot.is_booked
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {slot.is_booked ? "Booked by Patient" : "Available"}
                  </span>
                </div>

                {!slot.is_booked && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={deletingId === slot.id}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No upcoming availability slots published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
