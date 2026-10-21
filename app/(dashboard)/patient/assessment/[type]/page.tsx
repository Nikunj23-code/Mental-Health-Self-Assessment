"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import AdaptiveQuestionCard from "@/components/assessment/AdaptiveQuestionCard";
import CrisisSafetyModal from "@/components/assessment/CrisisSafetyModal";
import ScoreResultCard from "@/components/assessment/ScoreResultCard";
import { submitAssessment } from "@/server/actions/assessment";
import Navbar from "@/components/Navbar";

// Standard PHQ-9 questions fallback if network schema unavailable
const DEFAULT_PHQ9_QUESTIONS = [
  { id: "phq9_q1", text: "Little interest or pleasure in doing things" },
  { id: "phq9_q2", text: "Feeling down, depressed, or hopeless" },
  { id: "phq9_q3", text: "Trouble falling or staying asleep, or sleeping too much" },
  { id: "phq9_q4", text: "Feeling tired or having little energy" },
  { id: "phq9_q5", text: "Poor appetite or overeating" },
  { id: "phq9_q6", text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down" },
  { id: "phq9_q7", text: "Trouble concentrating on things, such as reading the newspaper or watching television" },
  { id: "phq9_q8", text: "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual" },
  { id: "phq9_q9", text: "Thoughts that you would be better off dead, or of hurting yourself in some way" },
];

// Standard GAD-7 questions fallback if network schema unavailable
const DEFAULT_GAD7_QUESTIONS = [
  { id: "gad7_q1", text: "Feeling nervous, anxious, or on edge" },
  { id: "gad7_q2", text: "Not being able to stop or control worrying" },
  { id: "gad7_q3", text: "Worrying too much about different things" },
  { id: "gad7_q4", text: "Trouble relaxing" },
  { id: "gad7_q5", text: "Being so restless that it's hard to sit still" },
  { id: "gad7_q6", text: "Becoming easily annoyed or irritable" },
  { id: "gad7_q7", text: "Feeling afraid, as if something awful might happen" },
];

const STANDARD_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

export default function AssessmentRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const rawType = (params?.type as string) || "phq-9";
  const assessmentType = rawType.toLowerCase().includes("gad") ? "GAD-7" : "PHQ-9";

  const questions = assessmentType === "PHQ-9" ? DEFAULT_PHQ9_QUESTIONS : DEFAULT_GAD7_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{
    totalScore: number;
    severityBand: string;
    crisisFlag: boolean;
  } | null>(null);

  const currentQ = questions[currentIndex];
  const currentValue = answers[currentQ.id];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (val: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));

    // Zero-latency Crisis Interception on PHQ-9 Item 9
    if (currentQ.id === "phq9_q9" && val > 0) {
      setShowCrisisModal(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    // Validate that all questions are answered
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setErrorMsg(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitAssessment({
        assessmentType,
        answers,
      });

      if (!response.success || !response.data) {
        setErrorMsg(response.error || "Failed to submit assessment.");
        setIsSubmitting(false);
        return;
      }

      setResult({
        totalScore: response.data.totalScore,
        severityBand: response.data.severityBand,
        crisisFlag: response.data.crisisFlag,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Zero-latency safety modal */}
      <CrisisSafetyModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/patient/assessment"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel Assessment
          </Link>

          <span className="text-xs font-semibold text-slate-500">
            {assessmentType} Clinical Protocol
          </span>
        </div>

        {result ? (
          /* Assessment Completed Result View */
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-3xl p-6 text-center">
              <span className="p-3 bg-teal-600 text-white rounded-full inline-flex mb-3 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Assessment Completed Successfully
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Your responses have been securely encrypted and evaluated. Below is your clinical severity classification.
              </p>
            </div>

            <ScoreResultCard
              assessmentType={assessmentType}
              totalScore={result.totalScore}
              severityBand={result.severityBand}
              crisisFlag={result.crisisFlag}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/patient/match"
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all text-center shadow-md shadow-teal-600/20"
              >
                View Recommended Therapists →
              </Link>
              <Link
                href="/patient/progress"
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold rounded-xl text-sm transition-all text-center"
              >
                View Progress Trajectory
              </Link>
            </div>
          </div>
        ) : (
          /* Active Question Step */
          <div className="space-y-6">
            {/* Header / Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {/* Question Card Component */}
            <AdaptiveQuestionCard
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              questionText={currentQ.text}
              instruction="Over the last 2 weeks, how often have you been bothered by any of the following problems?"
              options={STANDARD_OPTIONS}
              selectedValue={currentValue}
              onSelect={handleSelectOption}
            />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentValue === undefined}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-600/20"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || currentValue === undefined}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-slate-900/20"
                >
                  {isSubmitting ? "Calculating..." : "Submit Assessment"}
                </button>
              )}
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Responses are confidential and stored in accordance with clinical data standards.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
