'use server';
import { createClient } from '@/lib/supabase/server';
import { calculatePHQ9,calculateGAD7 } from '@/lib/clinical/scoring';
import { revalidatePath } from 'next/cache';
type Type='PHQ-9'|'GAD-7';
export type SubmitAssessmentParams={assessmentType:Type;answers:Record<string,number>;schemaId?:string};
export async function loadAssessmentSchema(type:Type) {
 if(!['PHQ-9','GAD-7'].includes(type)) return {error:'Unknown assessment.'};
 const db=await createClient();
 const {data,error}=await db.from('assessment_schemas').select('id,type,version,title,description,schema_json').eq('type',type).eq('is_active',true).single();
 if(error||!data) return {error:'Assessment temporarily unavailable. Please retry later.'};
 return {schema:data};
}
export async function recordSafetySignal(eventId:string,itemScore:number,acknowledged=false) {
 if(!/^[0-9a-f-]{36}$/i.test(eventId)||![1,2,3].includes(itemScore))return {success:false,error:'Invalid safety response'};
 const db=await createClient();
 const {error}=await (db as any).rpc('record_item9_safety',{p_client_event_id:eventId,p_item_score:itemScore,p_acknowledged:acknowledged});
 return {success:!error,error:error?.message};
}
export async function submitAssessment(params:SubmitAssessmentParams | Type, _schemaId?:string, legacyAnswers?:Record<string,number>) {
 const type=typeof params==='string'?params:params.assessmentType;
 const answers=typeof params==='string'?(legacyAnswers||{}):params.answers;
 if(!['PHQ-9','GAD-7'].includes(type))return {success:false,error:'Invalid assessment type.'};
 const n=type==='PHQ-9'?9:7,prefix=type==='PHQ-9'?'phq9_q':'gad7_q';
 if(!answers||Object.keys(answers).length!==n||Array.from({length:n},(_,i)=>answers[prefix+(i+1)]).some(x=>!Number.isInteger(x)||x<0||x>3))
   return {success:false,error:'Please answer every question with a valid option.'};
 const db=await createClient();
 const {data:auth}=await db.auth.getUser();
 if(!auth.user)return {success:false,error:'Please sign in to submit.'};
 const {data,error}=await (db as any).rpc('submit_screening',{p_type:type,p_answers:answers});
 if(error||!data) return {success:false,error:error?.message||'Unable to save. Please try again.'};
 const scoreResult=type==='PHQ-9'?calculatePHQ9(answers):calculateGAD7(answers);
 revalidatePath('/patient');revalidatePath('/patient/match');revalidatePath('/patient/progress');
 return {success:true,data:{...(data as any),scoreResult}};
}
