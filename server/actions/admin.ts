'use server';
import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function verifyTherapist(therapistId:string,isVerified:boolean) {
 const db=await createClient();
 const {data,error}=await (db as any).rpc('review_therapist',{p_id:therapistId,p_verified:isVerified});
 if(error||!data)throw Error(error?.message||'Review was not saved.');
 revalidatePath('/admin');revalidatePath('/admin/verifications');revalidatePath('/patient/match');
 return {success:true};
}
export async function resolveCrisis(crisisLogId:string,resolutionNotes:string) {
 const db=await createClient();const {data:auth}=await db.auth.getUser();
 if(!auth.user)throw Error('Unauthorized');
 const {data:profile}=await db.from('profiles').select('role').eq('id',auth.user.id).single();
 if((profile as any)?.role!=='admin')throw Error('Admin review required');
 if(!resolutionNotes.trim())throw Error('Enter review notes');
 const {data,error}=await (db as any).rpc('resolve_crisis_case',{p_case_id:crisisLogId,p_notes:resolutionNotes});
 if(error||!data)throw Error(error?.message||'Unable to resolve case');
 revalidatePath('/admin/crisis');return {success:true};
}
