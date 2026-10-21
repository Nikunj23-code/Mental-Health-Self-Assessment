'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function bookAppointment(therapistId: string, slotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: slot, error: slotError } = await (supabase as any)
    .from('therapist_availability')
    .select('slot_date, start_time, end_time, is_booked')
    .eq('id', slotId)
    .single();

  if (slotError || !slot) throw new Error('Slot not found');
  if ((slot as any).is_booked) throw new Error('This slot is already booked.');

  const { data: appointment, error: bookError } = await (supabase as any)
    .from('appointments')
    .insert({
      patient_id: user.id,
      therapist_id: therapistId,
      availability_slot_id: slotId,
      appointment_date: (slot as any).slot_date,
      start_time: (slot as any).start_time,
      end_time: (slot as any).end_time,
      status: 'scheduled',
      meeting_link: `https://meet.jit.si/mindalign-session-${slotId.slice(0, 8)}`,
    })
    .select('id')
    .single();

  if (bookError || !appointment) {
    throw new Error(`Booking failed: ${bookError?.message}`);
  }

  const appointmentId = (appointment as any).id;

  await (supabase as any).from('notifications').insert({
    recipient_id: therapistId,
    title: 'New Session Booked',
    message: `A patient has booked a session for ${(slot as any).slot_date} at ${(slot as any).start_time}.`,
    type: 'appointment',
    link: `/therapist/patients`,
  });

  await (supabase as any).from('audit_logs').insert({
    user_id: user.id,
    action: 'APPOINTMENT_BOOKED',
    table_affected: 'appointments',
    record_id: appointmentId,
    metadata: { therapistId, slotId, date: (slot as any).slot_date },
  });

  revalidatePath('/patient');
  revalidatePath('/therapist');

  return { success: true, appointmentId };
}

export async function cancelAppointment(appointmentId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await (supabase as any)
    .from('appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
    })
    .eq('id', appointmentId);

  if (error) throw new Error(error.message);

  revalidatePath('/patient');
  revalidatePath('/therapist');

  return { success: true };
}
