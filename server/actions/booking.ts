'use server';
import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function bookAppointment(therapistId:string,slotId:string) {
 const db=await createClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)throw Error('Please sign in.');
 const {data,error}=await (db as any).rpc('book_session',{p_therapist_id:therapistId,p_slot_id:slotId});
 if(error||!data)throw Error(error?.message||'This slot is unavailable.');
 revalidatePath('/patient');revalidatePath('/patient/appointments');revalidatePath('/therapist');
 revalidatePath('/patient/match');return {success:true,appointmentId:String(data)};
}
export async function cancelAppointment(appointmentId:string,reason:string) {
 const db=await createClient();
 const {data,error}=await (db as any).rpc('cancel_session',{p_appointment_id:appointmentId,p_reason:reason||''});
 if(error||!data)throw Error(error?.message||'Cancellation failed');
 revalidatePath('/patient');revalidatePath('/patient/appointments');revalidatePath('/therapist');
 return {success:true};
}
