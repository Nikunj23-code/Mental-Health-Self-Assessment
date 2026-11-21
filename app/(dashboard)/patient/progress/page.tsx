import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {LongitudinalChart} from '@/components/progress/LongitudinalChart';
import {Activity,ArrowLeft,ClipboardList,HeartPulse,CalendarDays,BookOpen,TrendingUp} from 'lucide-react';

export default async function PatientProgressPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login');
 const [{data:assessments,error},{data:plans,error:plansError}]=await Promise.all([
  db.from('assessments').select('id,type,total_score,severity,created_at,has_crisis_flag').eq('patient_id',user.id).order('created_at',{ascending:true}),
  (db as any).rpc('get_patient_shared_plans')
 ]);
 const list=(assessments||[]) as any[];
 const phq=list.filter(a=>a.type==='PHQ-9'), gad=list.filter(a=>a.type==='GAD-7');
 const changes=[{name:'PHQ-9',max:27,values:phq},{name:'GAD-7',max:21,values:gad}];
 const chartData=list.map(a=>({date:a.created_at,phq9:a.type==='PHQ-9'?a.total_score:undefined,gad7:a.type==='GAD-7'?a.total_score:undefined}));
 return <div className="min-h-[80vh] bg-slate-50 px-4 py-10 sm:px-6"><div className="mx-auto max-w-6xl space-y-7">
  <Link href="/patient" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="size-4"/> Dashboard</Link>
  <header><div className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Measurement-based care</div><h1 className="mt-2 text-3xl font-black text-slate-950">My progress</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Review saved screenings over time. A single result is a baseline; change between results is not a clinical diagnosis.</p></header>
  {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Unable to retrieve your history. Please retry the page.</div>}
  <div className="grid gap-4 sm:grid-cols-3">
   <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><ClipboardList className="size-5 text-teal-700"/><p className="mt-2 text-3xl font-black">{list.length}</p><p className="text-xs font-semibold text-slate-500">Assessments saved</p></div>
   {changes.map(c=>{const count=c.values.length;const first=c.values[0]?.total_score,last=c.values[count-1]?.total_score;return <div key={c.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Activity className="size-5 text-teal-700"/><p className="mt-2 text-2xl font-extrabold">{count?last+'/'+c.max:'No baseline'}</p><p className="text-xs font-semibold text-slate-500">{c.name} latest screening</p><p className="mt-2 text-xs text-slate-600">{count>=2?'Change from first: '+(last-first>0?'+':'')+(last-first)+' points':count===1?'Baseline recorded · retake later':'Complete this assessment to start'}</p></div>})}
  </div>
  <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Symptom scores across time</h2><p className="text-xs text-slate-500">PHQ-9: 0–27; GAD-7: 0–21. Each point is one recorded screening, not a predicted trend.</p></div>
   {error?<p className="text-sm text-slate-600">Chart unavailable while history cannot be loaded.</p>:<LongitudinalChart data={chartData}/>}
  </section>
  <div className="grid gap-6 lg:grid-cols-2">
   <section className="rounded-3xl border border-slate-200 bg-white p-6"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-bold text-slate-900"><ClipboardList className="size-5 text-teal-700"/> Assessment history</h2><Link href="/patient/assessment" className="text-xs font-bold text-teal-700">Take another</Link></div>
    {list.length===0?<p className="py-8 text-sm text-slate-500">No saved assessments yet. Start with PHQ-9 or GAD-7.</p>:<div className="divide-y divide-slate-100">{[...list].reverse().map(a=><Link key={a.id} href={'/patient/assessment/result/'+a.id} className="flex items-center justify-between gap-3 py-4 hover:bg-slate-50"><div><p className="text-sm font-bold">{a.type}</p><p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</p></div><div className="text-right"><p className="text-sm font-bold text-teal-800">{a.total_score}/{a.type==='PHQ-9'?27:21}</p><p className="text-xs capitalize text-slate-500">{String(a.severity).replaceAll('_',' ')}</p></div></Link>)}</div>}
   </section>
   <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><BookOpen className="size-5 text-teal-700"/> Plans shared by my therapist</h2>
    {plansError?<p className="text-sm text-rose-700">Shared plans could not be loaded.</p>:(plans||[]).length===0?<p className="py-8 text-sm text-slate-500">After a consultation, a clinician can choose to share your follow-up plan. Private notes remain confidential.</p>:<div className="space-y-3">{(plans||[]).map((p:any)=><article key={p.id} className="rounded-xl border border-teal-100 bg-teal-50/40 p-4"><p className="text-sm font-bold">{p.therapist_name}</p><p className="mt-1 text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</p><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{p.plan_homework}</p></article>)}</div>}
   </section>
  </div>
  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 text-sm text-slate-700"><p className="font-bold">Next step</p><p className="mt-1">Use your latest result to explore an eligible therapist, or continue tracking your wellbeing with another screening at an appropriate interval.</p><div className="mt-3 flex flex-wrap gap-3"><Link href="/patient/match" className="text-sm font-bold text-teal-800">Find matching therapists →</Link><Link href="/patient/appointments" className="text-sm font-bold text-teal-800">Appointments →</Link></div></div>
 </div></div>;
}
