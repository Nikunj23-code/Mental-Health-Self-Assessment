import { severity_level } from '@/types/database';
import { generateExplanation, CandidateInfo, PatientCriteriaInfo } from './explainability';

export interface MatchingCandidate extends CandidateInfo {
  therapistId: string;
  hourlyRate: number;
  gender?: string;
}

export interface PatientCriteria extends PatientCriteriaInfo {
  patientId?: string;
  preferredGender?: string;
}

export interface MatchResult {
  therapist: MatchingCandidate;
  totalMatchScore: number;
  subScores: {
    specialty: number;
    severity: number;
    availability: number;
    rating: number;
    preference: number;
  };
  explanation: string;
  rank: number;
}

export function rankTherapists(
  candidates: MatchingCandidate[],
  criteria: PatientCriteria
): MatchResult[] {
  const needs = new Set<string>();
  if ((criteria.phq9Score ?? 0) >= 10) {
    needs.add('Depression');
    needs.add('CBT');
  }
  if ((criteria.gad7Score ?? 0) >= 10) {
    needs.add('Anxiety');
    needs.add('Mindfulness');
  }
  if (needs.size === 0) {
    needs.add('Stress');
    needs.add('General Counseling');
  }

  const isSevere = criteria.phq9Severity === 'severe' || criteria.gad7Severity === 'severe';

  const scored = candidates.map((t) => {
    // 1. Specialty Alignment (35%)
    const matchedSpecialties = t.specialties.filter((s) => needs.has(s));
    const specialtyScore = Math.min(1.0, matchedSpecialties.length / Math.max(1, needs.size));

    // 2. Severity-Acuity Suitability (25%)
    let severityScore = 0.8;
    const isClinicalPro =
      t.title.toLowerCase().includes('psychologist') ||
      t.title.toLowerCase().includes('psychiatrist');

    if (isSevere) {
      severityScore = isClinicalPro ? 1.0 : 0.2;
    } else if (criteria.phq9Severity === 'moderate' || criteria.gad7Severity === 'moderate') {
      severityScore = 1.0;
    }

    // 3. Availability Score (20%)
    const availabilityScore = Math.min(1.0, t.unbookedSlotsCount / 5);

    // 4. Rating Benchmark (10%)
    const ratingScore = t.averageRating / 5.0;

    // 5. User Preference Concordance (10%)
    let prefScore = 0.5;
    if (criteria.preferredLanguage && t.languages.includes(criteria.preferredLanguage)) {
      prefScore += 0.25;
    }
    if (!criteria.preferredGender || criteria.preferredGender === 'No Preference' || criteria.preferredGender === t.gender) {
      prefScore += 0.25;
    }
    prefScore = Math.min(1.0, prefScore);

    const totalMatchScore = Math.round(
      (0.35 * specialtyScore +
        0.25 * severityScore +
        0.20 * availabilityScore +
        0.10 * ratingScore +
        0.10 * prefScore) *
        100
    );

    const subScores = {
      specialty: specialtyScore,
      severity: severityScore,
      availability: availabilityScore,
      rating: ratingScore,
      preference: prefScore,
    };

    const explanation = generateExplanation(t, criteria, subScores, matchedSpecialties);

    return {
      therapist: t,
      totalMatchScore,
      subScores,
      explanation,
      rank: 0,
    };
  });

  scored.sort((a, b) => b.totalMatchScore - a.totalMatchScore);

  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
