import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {LongitudinalChart} from '@/components/progress/LongitudinalChart';
import {ArrowLeft,CalendarDays,FileText,HeartPulse,Info} from 'lucide-react';

export default async function TherapistPatientDetail({params}:{params:Promise<{patientId:string}>}){
 const {patientId}=await params;
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login');
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).single();
 if((profile as any)?.role!=='therapist')notFound();
 const {data:appointments,error:accessError}=await db.from('appointments')
 .select('id,patient_id,appointment_date,start_time,end_time,status')
 .eq('therapist_id',user.id).eq('patient_id',patientId).order('appointment_date',{ascending:false});
 if(accessError||!appointments?.length)notFound();
 const [{data:patient},{data:assessments,error:scoreError}]=await Promise.all([
 db.from('profiles').select('id,full_name').eq('id',patientId).single(),
 db.from('assessments').select('id,type,total_score,severity,created_at,has_crisis_flag').eq('patient_id',patientId).order('created_at',{ascending:true})
 ]);
 const list=(assessments||[]) as any[];
 const latestPHQ=[...list].reverse().find(a=>a.type==='PHQ-9');
 const latestGAD=[...list].reverse().find(a=>a.type==='GAD-7');
 const chartData=list.map(a=>({date:a.created_at,phq9:a.type==='PHQ-9'?a.total_score:undefined,gad7:a.type==='GAD-7'?a.total_score:undefined}));
 return <div className="min-h-[75vh] bg-slate-50 px-4 py-10 sm:px-6"><div className="mx-auto max-w-6xl space-y-6">
 <Link href="/therapist/patients" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="size-4"/> My patients</Link>
 <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Assigned care · Restricted clinician view</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{(patient as any)?.full_name||'Patient'}</h1><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Info className="size-4"/>This view contains screening history only for patients with an appointment assigned to you. Screening scores are not diagnoses.</p></div>
 <div className="grid gap-4 sm:grid-cols-2">
 {[[latestPHQ,'PHQ-9','Depression',27],[latestGAD,'GAD-7','Anxiety',21]].map(([a,type,label,max]:any[])=> <div key={type} className="rounded-2xl border border-slate-200 bg-white p-6">
 <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><HeartPulse className="size-4 text-teal-700"/>{label} · {type}</h2>
 {a?<><p className="mt-2 text-3xl font-black text-teal-800">{a.total_score}<span className="text-base text-slate-400">/{max}</span></p><p className="mt-1 text-xs capitalize text-slate-500">{String(a.severity).replaceAll('_',' ')} · {new Date(a.created_at).toLocaleDateString('en-IN')}</p></>:<p className="mt-4 text-sm text-slate-500">Not assessed yet.</p>}
 </div>)}
 </div>
 <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-2 text-lg font-bold">Assessment timeline</h2>{scoreError?<p role="alert" className="text-sm text-rose-700">Unable to load scores.</p>:<LongitudinalChart data={chartData}/>}</section>
 <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><CalendarDays className="size-5 text-teal-700"/> Assigned appointments</h2>
 <div className="divide-y divide-slate-100">{(appointments as any[]).map(a=><article key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-sm font-bold">{new Date(a.appointment_date+'T12:00:00+05:30').toLocaleDateString('en-IN',{dateStyle:'medium'})} · {a.start_time.slice(0,5)} IST</p><p className="text-xs capitalize text-slate-500">{a.status}</p></div><Link href={'/therapist/sessions/'+a.id} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white"><FileText className="size-4"/> Session note</Link></article>)}</div>
 </section></div></div>;
}
