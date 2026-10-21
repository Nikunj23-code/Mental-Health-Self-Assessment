import { severity_level } from '@/types/database';

export interface ScoreResult {
  totalScore: number;
  severity: severity_level;
  severityLabel: string;
  hasCrisisFlag: boolean;
  clinicalRecommendation: string;
}

export function calculatePHQ9(responses: Record<string, number>): ScoreResult {
  let totalScore = 0;
  for (let i = 1; i <= 9; i++) {
    totalScore += responses[`phq9_q${i}`] || 0;
  }

  const hasCrisisFlag = (responses['phq9_q9'] || 0) > 0;

  let severity: severity_level = 'minimal';
  let severityLabel = 'Minimal / None';
  let clinicalRecommendation = 'Supportive wellness, psychoeducation, and lifestyle pacing.';

  if (totalScore >= 20) {
    severity = 'severe';
    severityLabel = 'Severe Depression';
    clinicalRecommendation = 'Immediate clinical evaluation by a licensed Clinical Psychologist or Psychiatrist.';
  } else if (totalScore >= 15) {
    severity = 'moderately_severe';
    severityLabel = 'Moderately Severe Depression';
    clinicalRecommendation = 'Active psychotherapy (CBT) and clinical psychiatric consultation recommended.';
  } else if (totalScore >= 10) {
    severity = 'moderate';
    severityLabel = 'Moderate Depression';
    clinicalRecommendation = 'Structured psychotherapy and behavioral activation recommended.';
  } else if (totalScore >= 5) {
    severity = 'mild';
    severityLabel = 'Mild Depression';
    clinicalRecommendation = 'Watchful waiting, self-guided CBT resources, and stress reduction.';
  }

  return { totalScore, severity, severityLabel, hasCrisisFlag, clinicalRecommendation };
}

export function calculateGAD7(responses: Record<string, number>): ScoreResult {
  let totalScore = 0;
  for (let i = 1; i <= 7; i++) {
    totalScore += responses[`gad7_q${i}`] || 0;
  }

  let severity: severity_level = 'minimal';
  let severityLabel = 'Minimal Anxiety';
  let clinicalRecommendation = 'Normal stress management practices and mindfulness.';

  if (totalScore >= 15) {
    severity = 'severe';
    severityLabel = 'Severe Anxiety';
    clinicalRecommendation = 'Comprehensive clinical assessment and cognitive behavioral intervention.';
  } else if (totalScore >= 10) {
    severity = 'moderate';
    severityLabel = 'Moderate Anxiety';
    clinicalRecommendation = 'Cognitive restructuring, exposure therapy, and therapist-guided care.';
  } else if (totalScore >= 5) {
    severity = 'mild';
    severityLabel = 'Mild Anxiety';
    clinicalRecommendation = 'Relaxation techniques and watchful monitoring.';
  }

  return { totalScore, severity, severityLabel, hasCrisisFlag: false, clinicalRecommendation };
}
