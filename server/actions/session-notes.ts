'use server';
import {createClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export interface SessionNoteInput {
 appointmentId:string;patientId:string;subjectiveNotes:string;objectiveObservations:string;
 assessmentDiagnosis:string;planHomework:string;moodRating:number;riskAssessment:string;isSharedWithPatient:boolean;
}
export async function recordSessionNotes(input:SessionNoteInput) {
 const db=await createClient();
 const {data,error}=await (db as any).rpc('save_session_note',{
 p_appointment_id:input.appointmentId,p_subjective:input.subjectiveNotes,p_objective:input.objectiveObservations,
 p_assessment:input.assessmentDiagnosis,p_plan:input.planHomework,p_mood:input.moodRating,
 p_risk:input.riskAssessment,p_shared:input.isSharedWithPatient
 });
 if(error||!data)throw Error(error?.message||'Note could not be saved.');
 revalidatePath('/therapist/patients');revalidatePath('/therapist');revalidatePath('/patient/progress');
 return {success:true,noteId:String(data)};
}
