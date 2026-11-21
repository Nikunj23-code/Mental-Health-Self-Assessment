import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import ScoreResultCard from '@/components/assessment/ScoreResultCard';
import {ArrowLeft,CheckCircle2,Info} from 'lucide-react';
export default async function ScreeningResultPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login');
 const {data:result,error}=await db.from('assessments').select('id,type,total_score,severity,has_crisis_flag,created_at').eq('id',id).eq('patient_id',user.id).single();
 if(error||!result)notFound();
 const a=result as any;
 return <div className="bg-gradient-to-b from-teal-50/50 via-white to-slate-50 px-4 py-10 sm:px-6">
  <div className="mx-auto max-w-3xl">
   <Link href="/patient/assessment" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4"/> Assessments</Link>
   <div className="mb-6 rounded-2xl border border-teal-100 bg-white p-5">
    <p className="flex items-center gap-2 text-sm font-bold text-teal-800"><CheckCircle2 className="size-5"/> Assessment saved successfully</p>
    <p className="mt-1 text-xs text-slate-500">Completed {new Date(a.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</p>
   </div>
   <ScoreResultCard assessmentType={a.type} totalScore={a.total_score} severityBand={a.severity} crisisFlag={a.has_crisis_flag} completedAt={a.created_at}/>
   <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><Info className="size-5 shrink-0 text-teal-700"/>This self-report screening helps identify symptom patterns. It cannot establish a diagnosis, predict outcomes, or replace assessment by a qualified professional.</div>
   <div className="mt-5 flex flex-wrap gap-3">
    <Link href="/patient/progress" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">View my progress</Link>
    <Link href="/patient/assessment" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700">Other assessments</Link>
   </div>
  </div>
 </div>
}
