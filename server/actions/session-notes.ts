'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SessionNoteInput {
  appointmentId: string;
  patientId: string;
  subjectiveNotes: string;
  objectiveObservations: string;
  assessmentDiagnosis: string;
  planHomework: string;
  moodRating: number;
  riskAssessment: string;
  isSharedWithPatient: boolean;
}

export async function recordSessionNotes(input: SessionNoteInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Verify therapist profile
  const { data: therapistProfile } = await (supabase as any)
    .from('therapist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!therapistProfile) {
    throw new Error('Forbidden: Clinician profile not found.');
  }

  const { data: appointment } = await (supabase as any)
    .from('appointments')
    .select('*')
    .eq('id', input.appointmentId)
    .single();

  if ((appointment as any)?.therapist_id !== (therapistProfile as any).id) {
    throw new Error('Forbidden: Only the assigned therapist can document this session.');
  }

  const { data: note, error } = await (supabase as any)
    .from('session_notes')
    .upsert(
      {
        appointment_id: input.appointmentId,
        therapist_id: (therapistProfile as any).id,
        patient_id: input.patientId,
        subjective_notes: input.subjectiveNotes,
        objective_observations: input.objectiveObservations,
        assessment_diagnosis: input.assessmentDiagnosis,
        plan_homework: input.planHomework,
        mood_rating: input.moodRating,
        risk_assessment: input.riskAssessment,
        is_shared_with_patient: input.isSharedWithPatient,
      },
      { onConflict: 'appointment_id' }
    )
    .select('id')
    .single();

  if (error || !note) {
    throw new Error(`Failed to save session notes: ${error?.message}`);
  }

  await (supabase as any)
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', input.appointmentId);

  if (input.isSharedWithPatient) {
    await (supabase as any).from('notifications').insert({
      recipient_id: input.patientId,
      title: 'Session Summary & Homework Updated',
      message: 'Your therapist has shared clinical observations and action steps for your recovery.',
      type: 'info',
      link: '/patient/progress',
    });
  }

  revalidatePath('/therapist/patients');
  revalidatePath('/patient/progress');

  return { success: true, noteId: (note as any).id };
}
