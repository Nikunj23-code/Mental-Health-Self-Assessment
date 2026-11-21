'use server';
import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function addAvailabilitySlot(date:string,startTime:string,endTime:string) {
 const db=await createClient();const {data:auth}=await db.auth.getUser();
 if(!auth.user)throw Error('Please sign in.');
 const {data:therapist,error:readError}=await db.from('therapist_profiles').select('id').eq('id',auth.user.id).single();
 if(readError||!therapist)throw Error('Therapist profile not found.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^(?:[01]\d|2[0-3]):[0-5]\d/.test(startTime)||!/^(?:[01]\d|2[0-3]):[0-5]\d/.test(endTime)||endTime<=startTime)
  throw Error('Enter a valid slot and time range.');
 if(new Date(date+'T'+startTime+'+05:30').getTime()<=Date.now())throw Error('Choose a future appointment.');
 const {error}=await db.from('therapist_availability').insert({therapist_id:auth.user.id,slot_date:date,start_time:startTime,end_time:endTime,is_booked:false} as any);
 if(error)throw Error(error.message);
 revalidatePath('/therapist/availability');revalidatePath('/patient/match');return {success:true};
}
export async function deleteAvailabilitySlot(slotId:string) {
 const db=await createClient();const {data:auth}=await db.auth.getUser();
 if(!auth.user)throw Error('Please sign in.');
 const {data,error}=await db.from('therapist_availability').delete().eq('id',slotId).eq('therapist_id',auth.user.id).eq('is_booked',false).select('id');
 if(error||!data?.length)throw Error(error?.message||'Slot not found or already booked.');
 revalidatePath('/therapist/availability');revalidatePath('/patient/match');return {success:true};
}
