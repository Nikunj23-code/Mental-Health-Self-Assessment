'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
export default function ResetPasswordPage(){
 const router=useRouter();const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setMessage('');
  if(password.length<8||password!==confirm){setMessage('Passwords must match and contain at least 8 characters.');return;}
  setPending(true);try{const db=createClient();const {error}=await db.auth.updateUser({password});
   if(error)throw error;setMessage('Password updated successfully.');setTimeout(()=>router.replace('/login'),1200);
  }catch(e){setMessage(e instanceof Error?e.message:'Unable to update password. Request another recovery link.');}finally{setPending(false);}};
 return <section className="flex min-h-[73vh] items-center justify-center bg-slate-50 px-4 py-12"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
  <h1 className="text-2xl font-black tracking-tight">Create a new password</h1><p className="mt-2 text-sm text-slate-600">This page requires a valid recovery link from your email.</p>
  <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold">New password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label><label className="block text-sm font-bold">Confirm password<input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"/></label><button disabled={pending} className="w-full rounded-xl bg-teal-700 px-5 py-3 font-bold text-white disabled:opacity-50">{pending?'Saving...':'Update password'}</button></form>
  {message&&<p role="status" className="mt-4 rounded-xl bg-slate-100 p-4 text-sm">{message}</p>}
  <Link href="/forgot-password" className="mt-4 inline-block text-sm font-bold text-teal-700">Request a new link</Link>
 </div></section>;
}
