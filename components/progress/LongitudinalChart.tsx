'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartPoint {
  date: string;
  phq9?: number;
  gad7?: number;
}

interface Props {
  data: ChartPoint[];
}

export function LongitudinalChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-semibold text-slate-700">No Assessment Trends Recorded Yet</p>
        <p className="text-xs text-slate-500 mt-1">Complete your first PHQ-9 or GAD-7 assessment to track your clinical trajectory.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <div className="mb-3">
        <h3 className="font-bold text-slate-900 text-sm">Longitudinal Recovery & Severity Trajectory</h3>
        <p className="text-xs text-slate-500">Tracking PHQ-9 (Depression, 0-27) & GAD-7 (Anxiety, 0-21) across assessment milestones</p>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis domain={[0, 27]} tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px', border: 'none' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Line
            type="monotone"
            dataKey="phq9"
            name="Depression (PHQ-9)"
            stroke="#0F766E"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0F766E' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="gad7"
            name="Anxiety (GAD-7)"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0EA5E9' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
