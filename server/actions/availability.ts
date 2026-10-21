'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addAvailabilitySlot(date: string, startTime: string, endTime: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: therapistProfile } = await (supabase as any)
    .from('therapist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!therapistProfile) {
    throw new Error('Therapist profile not found.');
  }

  const { error } = await (supabase as any).from('therapist_availability').insert({
    therapist_id: (therapistProfile as any).id,
    slot_date: date,
    start_time: startTime,
    end_time: endTime,
    is_booked: false,
  });

  if (error) {
    throw new Error(`Failed to add availability: ${error.message}`);
  }

  revalidatePath('/therapist/availability');
  return { success: true };
}

export async function deleteAvailabilitySlot(slotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: therapistProfile } = await (supabase as any)
    .from('therapist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!therapistProfile) {
    throw new Error('Therapist profile not found.');
  }

  const { error } = await (supabase as any)
    .from('therapist_availability')
    .delete()
    .eq('id', slotId)
    .eq('therapist_id', (therapistProfile as any).id)
    .eq('is_booked', false);

  if (error) {
    throw new Error(`Failed to remove slot: ${error.message}`);
  }

  revalidatePath('/therapist/availability');
  return { success: true };
}
