'use client';
import {useState} from 'react';
import Link from 'next/link';
import {requestPasswordReset} from '@/server/actions/auth';
import {Mail,LockKeyhole} from 'lucide-react';
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState(''),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setPending(true);setMessage('');try{
  const r=await requestPasswordReset(email);
  setMessage(r.message);
 }catch{setMessage('We could not send a reset link. Try again later.');}finally{setPending(false);}};
 return <section className="flex min-h-[73vh] items-center justify-center bg-slate-50 px-4 py-12"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100">
  <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><LockKeyhole className="size-6"/></div>
  <h1 className="text-2xl font-black tracking-tight text-slate-900">Reset your password</h1>
  <p className="mt-2 text-sm leading-relaxed text-slate-600">Enter your account email. We’ll send a secure link if an account exists.</p>
  <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold text-slate-700">Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="you@example.com"/></label>
  <button disabled={pending} className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending?'Sending...':'Send recovery link'}</button></form>
  {message&&<p role="status" className="mt-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
  <Link href="/login" className="mt-6 inline-block text-sm font-bold text-teal-800">← Back to sign in</Link>
 </div></section>;
}
