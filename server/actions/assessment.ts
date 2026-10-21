'use server';

import { createClient } from '@/lib/supabase/server';
import { calculatePHQ9, calculateGAD7 } from '@/lib/clinical/scoring';
import { assessment_type } from '@/types/database';
import { revalidatePath } from 'next/cache';

export interface SubmitAssessmentParams {
  assessmentType: assessment_type;
  answers: Record<string, number>;
  schemaId?: string;
}

export type SubmitAssessmentResponse = {
  success: boolean;
  error?: string;
  data?: {
    assessmentId: string;
    totalScore: number;
    severityBand: string;
    crisisFlag: boolean;
    scoreResult: any;
  };
};

export async function submitAssessment(
  paramsOrType: SubmitAssessmentParams | assessment_type,
  schemaIdArg?: string,
  responsesArg?: Record<string, number>
): Promise<SubmitAssessmentResponse> {
  let type: assessment_type = 'PHQ-9';
  let schemaId: string | undefined = undefined;
  let responses: Record<string, number> = {};

  if (typeof paramsOrType === 'string') {
    type = paramsOrType;
    schemaId = schemaIdArg;
    responses = responsesArg || {};
  } else {
    type = paramsOrType.assessmentType;
    schemaId = paramsOrType.schemaId;
    responses = paramsOrType.answers;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  // If schemaId not provided, fetch default from database
  if (!schemaId) {
    const { data: schemaRow } = await (supabase as any)
      .from('assessment_schemas')
      .select('id')
      .eq('instrument_type', type)
      .limit(1)
      .maybeSingle();

    if (schemaRow) {
      schemaId = (schemaRow as any).id;
    }
  }

  const scoreResult = type === 'PHQ-9' ? calculatePHQ9(responses) : calculateGAD7(responses);

  const { data: assessment, error: assessmentError } = await (supabase as any)
    .from('assessments')
    .insert({
      patient_id: user.id,
      schema_id: schemaId,
      assessment_type: type,
      total_score: scoreResult.totalScore,
      severity_band: scoreResult.severity,
      crisis_flag: scoreResult.hasCrisisFlag,
    })
    .select('id')
    .single();

  if (assessmentError || !assessment) {
    throw new Error(`Failed to save assessment: ${assessmentError?.message}`);
  }

  const assessmentId = (assessment as any).id;

  const responseInserts = Object.entries(responses).map(([key, val]) => ({
    assessment_id: assessmentId,
    question_id: key,
    response_value: val,
  }));

  if (responseInserts.length > 0) {
    await (supabase as any).from('assessment_responses').insert(responseInserts);
  }

  if (scoreResult.hasCrisisFlag) {
    await (supabase as any).from('crisis_logs').insert({
      patient_id: user.id,
      assessment_id: assessmentId,
      item_score: responses['phq9_q9'] || 1,
      status: 'open',
      safety_plan_acknowledged: true,
    });

    await (supabase as any).from('notifications').insert({
      recipient_id: user.id,
      title: 'Immediate Safety Lifelines Available',
      message: 'Your assessment flagged severe distress. Free 24/7 tele-counseling is immediately accessible via Tele-MANAS (14416).',
      type: 'crisis',
      link: '/patient/progress',
    });
  }

  await (supabase as any).from('audit_logs').insert({
    user_id: user.id,
    action: 'ASSESSMENT_COMPLETED',
    table_affected: 'assessments',
    record_id: assessmentId,
    metadata: {
      type,
      score: scoreResult.totalScore,
      severity: scoreResult.severity,
      crisis: scoreResult.hasCrisisFlag,
    },
  });

  revalidatePath('/patient/progress');
  revalidatePath('/patient');
  revalidatePath('/patient/match');

  try {
    return {
      success: true,
      data: {
        assessmentId: assessmentId,
        totalScore: scoreResult.totalScore,
        severityBand: scoreResult.severity,
        crisisFlag: scoreResult.hasCrisisFlag,
        scoreResult,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit assessment.';
    return {
      success: false,
      error: msg,
    };
  }
}
