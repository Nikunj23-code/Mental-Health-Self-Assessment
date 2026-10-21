'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifyTherapist(therapistId: string, isVerified: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required.');
  }

  const { error } = await (supabase as any)
    .from('therapist_profiles')
    .update({ is_verified: isVerified })
    .eq('id', therapistId);

  if (error) throw new Error(error.message);

  await (supabase as any).from('notifications').insert({
    recipient_id: therapistId,
    title: isVerified ? 'Therapist Profile Verified' : 'Profile Status Updated',
    message: isVerified
      ? 'Your credentials have been verified by the MindAlign clinical team. You can now receive patient appointments.'
      : 'Your clinical credentials require additional review.',
    type: 'info',
  });

  await (supabase as any).from('audit_logs').insert({
    user_id: user.id,
    action: isVerified ? 'THERAPIST_VERIFIED' : 'THERAPIST_UNVERIFIED',
    table_affected: 'therapist_profiles',
    record_id: therapistId,
  });

  revalidatePath('/admin/verifications');
  revalidatePath('/patient/match');

  return { success: true };
}

export async function resolveCrisis(crisisLogId: string, resolutionNotes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await (supabase as any)
    .from('crisis_logs')
    .update({
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', crisisLogId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/crisis');

  return { success: true };
}
