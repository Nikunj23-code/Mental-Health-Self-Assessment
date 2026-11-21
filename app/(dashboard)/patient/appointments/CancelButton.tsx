'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {cancelAppointment} from '@/server/actions/booking';
export default function CancelButton({appointmentId}:{appointmentId:string}){
 const router=useRouter();const [pending,setPending]=useState(false);const [err,setErr]=useState('');
 const cancel=async()=>{if(!window.confirm('Cancel this appointment?'))return;setPending(true);setErr('');
  try{await cancelAppointment(appointmentId,'Cancelled by patient');router.refresh();}
  catch(e){setErr(e instanceof Error?e.message:'Cancellation failed');}finally{setPending(false);}
 };
 return <div className="flex flex-col gap-1"><button type="button" onClick={cancel} disabled={pending} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">{pending?'Cancelling...':'Cancel appointment'}</button>{err&&<p role="alert" className="text-xs text-rose-700">{err}</p>}</div>;
}
