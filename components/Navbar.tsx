'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, User, LogOut, ShieldAlert, Calendar, LineChart, FileText } from 'lucide-react';
import { signOut } from '@/server/actions/auth';
import { user_role } from '@/types/database';

interface Props {
  userRole?: user_role;
  userName?: string;
  isLoggedIn?: boolean;
}

export function Navbar({ userRole, userName, isLoggedIn }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm group-hover:bg-teal-800 transition">
              <Activity className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <span className="font-extrabold text-teal-900 tracking-tight">Mind</span>
              <span className="font-extrabold text-teal-600">Align</span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide">EVIDENCE CARE</span>
            </div>
          </Link>

          {isLoggedIn && userRole === 'patient' && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/patient"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === '/patient' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/patient/assessment"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/patient/assessment') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assessments
              </Link>
              <Link
                href="/patient/match"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/patient/match') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Therapist Match
              </Link>
              <Link
                href="/patient/progress"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/patient/progress') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Progress
              </Link>
            </nav>
          )}

          {isLoggedIn && userRole === 'therapist' && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/therapist"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === '/therapist' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Schedule
              </Link>
              <Link
                href="/therapist/patients"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/therapist/patients') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patients & Notes
              </Link>
              <Link
                href="/therapist/availability"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/therapist/availability') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slot Manager
              </Link>
            </nav>
          )}

          {isLoggedIn && userRole === 'admin' && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === '/admin' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </Link>
              <Link
                href="/admin/verifications"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/admin/verifications') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Therapist Verifications
              </Link>
              <Link
                href="/admin/crisis"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/admin/crisis') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Crisis Logs
              </Link>
              <Link
                href="/admin/audit"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/admin/audit') ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Audit Trail
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">{userName || 'Account'}</span>
                <span className="text-[11px] uppercase tracking-wider text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">
                  {userRole}
                </span>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
