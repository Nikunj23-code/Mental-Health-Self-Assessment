import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {CalendarDays,Clock,ArrowLeft,Video,Info} from 'lucide-react';
import CancelButton from './CancelButton';
export default async function PatientAppointmentsPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login');
 const {data,error}=await db.from('appointments').select('id,appointment_date,start_time,end_time,status,meeting_link,created_at,therapist:therapist_profiles(id,title,profiles(full_name))').eq('patient_id',user.id).order('appointment_date',{ascending:false});
 const list=(data||[]) as any[];
 return <div className="min-h-[78vh] bg-slate-50 px-4 py-10 sm:px-6"><div className="mx-auto max-w-5xl">
  <Link href="/patient" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="size-4"/> Dashboard</Link>
  <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Your care schedule</p><h1 className="mt-2 text-3xl font-black text-slate-950">My appointments</h1><p className="mt-2 text-sm text-slate-600">All confirmed, completed and cancelled sessions in one place. Times shown in IST.</p></div>
   <Link href="/patient/match" className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800">Find a therapist</Link>
  </div>
  {error?<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Unable to load appointments right now. Try refreshing the page.</div>:list.length===0?
   <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm"><CalendarDays className="mx-auto size-10 text-slate-300"/><h2 className="mt-3 text-lg font-extrabold">No appointments booked yet</h2><p className="mt-2 text-sm text-slate-500">Take an assessment, review therapist matches, and select an available time.</p><Link href="/patient/assessment" className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white">Start assessment</Link></div>:
   <div className="grid gap-4">{list.map(a=><article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-lg font-extrabold text-slate-900">{a.therapist?.profiles?.full_name||'Therapist'}</p><p className="mt-1 text-sm text-slate-500">{a.therapist?.title||'Consultation'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-teal-700"/>{new Date(a.appointment_date+'T12:00:00+05:30').toLocaleDateString('en-IN',{dateStyle:'medium'})}</span><span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-teal-700"/>{a.start_time.slice(0,5)}–{a.end_time.slice(0,5)} IST</span></div>
     </div><div className="flex flex-wrap items-center gap-2"><span className={'rounded-full px-3 py-1 text-xs font-bold capitalize '+(a.status==='scheduled'?'bg-teal-50 text-teal-800':'bg-slate-100 text-slate-700')}>{a.status}</span>
      {a.status==='scheduled'&&<CancelButton appointmentId={a.id}/>}
     </div></div>
   </article>)}</div>}
  <p className="mt-7 flex items-start gap-2 text-xs text-slate-500"><Info className="size-4 shrink-0"/>Video consultations require appropriate privacy and clinician consent. Do not treat an unverified demo meeting link as a secure clinical call.</p>
 </div></div>;
}
