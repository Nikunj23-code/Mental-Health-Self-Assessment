"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, ShieldCheck, UserCheck, Stethoscope } from "lucide-react";
import { signUp } from "@/server/actions/auth";

const SPECIALIZATION_OPTIONS = [
  "Depression",
  "Generalized Anxiety",
  "Trauma / PTSD",
  "Relationship Counseling",
  "Mindfulness-Based Therapy",
  "Cognitive Behavioral Therapy (CBT)",
  "Stress Management",
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "therapist">("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Therapist specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>(["Depression"]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      if (specializations.length > 1) {
        setSpecializations(specializations.filter((s) => s !== spec));
      }
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (role === "therapist" && !licenseNumber.trim()) {
      setErrorMsg("Professional license number is required for therapist registration.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email,
        password,
        fullName,
        role,
        ...(role === "therapist"
          ? {
              licenseNumber,
              specializations,
              yearsOfExperience: Number(yearsOfExperience),
              hourlyRate: Number(hourlyRate),
              bio,
            }
          : {}),
      });

      if (!result.success) {
        setErrorMsg(result.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      setSuccessMsg(
        role === "therapist"
          ? "Therapist account registered! Please check your email to verify. Your credentials will be reviewed by admin for verification."
          : "Account created successfully! Redirecting..."
      );

      setTimeout(() => {
        router.push(role === "therapist" ? "/therapist" : "/patient");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <HeartPulse className="w-8 h-8 text-teal-600" />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Mind<span className="text-teal-600">Align</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Join the measurement-based mental health platform
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole("patient")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              role === "patient"
                ? "bg-white text-teal-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            I'm a Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("therapist")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              role === "therapist"
                ? "bg-white text-teal-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            I'm a Therapist
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-sm font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Jane Doe / John Smith"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Conditional Therapist Profile Fields */}
          {role === "therapist" && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> Professional Credentials
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  License Number / Registration (RCI / State Council)
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. RCI-CRR-2021-99881"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Consultation Fee (₹ / hr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Clinical Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATION_OPTIONS.map((spec) => {
                    const selected = specializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialization(spec)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selected
                            ? "bg-teal-50 border-teal-500 text-teal-800 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Professional Bio & Modality
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your therapeutic approach, credentials, and experience..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {loading ? "Registering..." : `Create ${role === "therapist" ? "Therapist" : "Patient"} Account`}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal-600 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
