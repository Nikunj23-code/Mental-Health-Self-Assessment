"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "@/server/actions/auth";
import { Activity, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await signIn(formData);
      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      // In Next.js, redirect throws a NEXT_REDIRECT digest error which should be re-thrown
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : "Failed to sign in.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold mb-3 shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to MindAlign</h1>
          <p className="text-xs text-slate-500 mt-1">Access your care dashboard, assessments, and sessions</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account yet?{" "}
          <Link href="/register" className="font-bold text-teal-700 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
