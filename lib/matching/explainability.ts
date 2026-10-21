export interface CandidateInfo {
  fullName: string;
  title: string;
  specialties: string[];
  experienceYears: number;
  languages: string[];
  averageRating: number;
  totalReviews: number;
  unbookedSlotsCount: number;
}

export interface PatientCriteriaInfo {
  phq9Score?: number;
  phq9Severity?: string;
  gad7Score?: number;
  gad7Severity?: string;
  preferredLanguage?: string;
}

export function generateExplanation(
  therapist: CandidateInfo,
  criteria: PatientCriteriaInfo,
  subScores: { specialty: number; severity: number; availability: number; rating: number; preference: number },
  matchedSpecialties: string[]
): string {
  const points: string[] = [];

  // 1. Specialty Alignment Justification
  if (matchedSpecialties.length > 0) {
    points.push(`Specializes in ${matchedSpecialties.join(' & ')}, aligning directly with your assessment profile.`);
  }

  // 2. Clinical Acuity & Severity Justification
  if (criteria.phq9Severity === 'severe' || criteria.gad7Severity === 'severe') {
    if (subScores.severity === 1.0) {
      points.push(`Holds advanced clinical licensing (${therapist.title}) essential for high-acuity crisis support.`);
    }
  } else if (therapist.experienceYears >= 8) {
    points.push(`Offers extensive clinical background with ${therapist.experienceYears}+ years of therapeutic practice.`);
  }

  // 3. Availability Justification
  if (therapist.unbookedSlotsCount >= 3) {
    points.push(`Has immediate availability with ${therapist.unbookedSlotsCount} open appointments this week.`);
  }

  // 4. Rating Benchmark
  if (therapist.averageRating >= 4.8) {
    points.push(`Top-rated practitioner (${therapist.averageRating.toFixed(2)}/5.0 from ${therapist.totalReviews} verified patient reviews).`);
  }

  // 5. Language Concordance
  if (criteria.preferredLanguage && therapist.languages.includes(criteria.preferredLanguage)) {
    points.push(`Conducts sessions in your preferred language (${criteria.preferredLanguage}).`);
  }

  return points.join(' ');
}
