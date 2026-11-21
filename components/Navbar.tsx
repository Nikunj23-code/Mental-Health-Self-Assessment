'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Activity,LogOut,Menu,HeartPulse} from 'lucide-react';
import {signOut} from '@/server/actions/auth';

type Role='patient'|'therapist'|'admin';
interface Props {isLoggedIn?:boolean;userRole?:Role;userName?:string}
const routes:Record<Role,{href:string;label:string}[]>={
 patient:[
 {href:'/patient',label:'Dashboard'}, {href:'/patient/assessment',label:'Assessments'},
 {href:'/patient/match',label:'Therapist Match'},{href:'/patient/appointments',label:'Appointments'},
 {href:'/patient/progress',label:'My Progress'}],
 therapist:[{href:'/therapist',label:'Overview'},{href:'/therapist/availability',label:'Availability'},
 {href:'/therapist/patients',label:'My Patients'}],
 admin:[{href:'/admin',label:'Overview'},{href:'/admin/verifications',label:'Verifications'},
 {href:'/admin/crisis',label:'Safety Queue'},{href:'/admin/audit',label:'Audit Log'}]
};
export function Navbar({isLoggedIn=false,userRole,userName}:Props) {
 const path=usePathname();
 const role=userRole&&routes[userRole]?userRole:undefined;
 const items=isLoggedIn&&role?routes[role]:[];
 const isActive=(href:string)=>path===href || (href!=='/'+role && path.startsWith(href+'/'));
 return <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
  <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
   <Link href={isLoggedIn&&role?'/'+role:'/'} className="group inline-flex shrink-0 items-center gap-2.5" aria-label="MindAlign home">
    <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-sm"><Activity className="size-5"/></span>
    <span className="leading-tight"><span className="block text-lg font-black tracking-tight text-slate-900">Mind<span className="text-teal-600">Align</span></span>
    <span className="block text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">Intelligent Care</span></span>
   </Link>
   {items.length>0&&<nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Primary navigation">
    {items.map(r=><Link key={r.href} href={r.href} aria-current={isActive(r.href)?'page':undefined} className={'whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors '+(isActive(r.href)?'bg-teal-50 text-teal-800':'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}>{r.label}</Link>)}
   </nav>}
   <div className="flex items-center gap-2">
    {isLoggedIn?<><span className="hidden max-w-40 truncate text-right text-xs font-semibold text-slate-600 sm:block">{userName||role||'Account'}</span>
      <form action={signOut}><button type="submit" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-rose-200 hover:text-rose-700"><LogOut className="size-4"/><span className="hidden sm:inline">Sign out</span></button></form>
    </>:<><Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</Link><Link href="/register" className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Get started</Link></>}
    {items.length>0&&<details className="relative lg:hidden"><summary className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-700" aria-label="Open navigation menu"><Menu className="size-5"/></summary>
      <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      {items.map(r=><Link key={r.href} href={r.href} aria-current={isActive(r.href)?'page':undefined} className={'block rounded-xl px-4 py-3 text-sm font-semibold '+(isActive(r.href)?'bg-teal-50 text-teal-800':'text-slate-700 hover:bg-slate-50')}>{r.label}</Link>)}
      </nav></details>}
   </div>
  </div>
 </header>;
}
export default Navbar;
