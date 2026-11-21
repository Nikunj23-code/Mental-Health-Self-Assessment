'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type PublicRole = 'patient' | 'therapist';
export interface SignUpInput {
  email: string; password: string; fullName: string; role?: PublicRole;
  preferredLanguage?: string; licenseNumber?: string; specializations?: string[];
  yearsOfExperience?: number; hourlyRate?: number; bio?: string; title?: string;
}
function isValidEmail(v:string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!isValidEmail(email) || !password) return {error:'Enter a valid email and password.'};
  const db=await createClient();
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error || !data.user) return {error:error?.message || 'Sign in unsuccessful.'};
  const {data:profile,error:profileError}=await db.from('profiles').select('role').eq('id',data.user.id).single();
  if(profileError || !profile || !['patient','therapist','admin'].includes((profile as any).role))
    return {error:'Your account needs profile assistance. Please contact support.'};
  revalidatePath('/','layout');
  const role=(profile as any).role;
  const requested=String(formData.get('returnTo')||'');
  const allowed=requested.startsWith('/'+role) && !requested.startsWith('//') && !requested.includes('\\\\');
  redirect(allowed?requested:'/'+role);
}
export async function signUp(input: SignUpInput | FormData) {
  const form = input instanceof FormData;
  const data:SignUpInput=form ? {
    email:String(input.get('email')||''),password:String(input.get('password')||''),
    fullName:String(input.get('fullName')||''),role:String(input.get('role')||'patient') as PublicRole,
    licenseNumber:String(input.get('licenseNumber')||'')
  } : input;
  const email=data.email.trim().toLowerCase(), fullName=data.fullName.trim();
  if(!isValidEmail(email)||fullName.length<2||fullName.length>120||data.password.length<8)
    return {success:false,error:'Enter a valid name, email and password of at least eight characters.'};
  if(data.role && !['patient','therapist'].includes(data.role)) return {success:false,error:'Invalid account role.'};
  const role=data.role||'patient';
  if(role==='therapist' && (!data.licenseNumber?.trim() || data.licenseNumber.length>120))
    return {success:false,error:'Enter your professional registration number.'};
  const db=await createClient();
  const {data:registered,error}=await db.auth.signUp({
    email,password:data.password,
    options:{emailRedirectTo:(process.env.NEXT_PUBLIC_SITE_URL||'https://mental-health-self-assessment.vercel.app')+'/auth/callback',data:{
      full_name:fullName,role,preferred_language:data.preferredLanguage||'English',
      license_number:role==='therapist'?data.licenseNumber?.trim():undefined,
      specialties:role==='therapist'?(data.specializations||[]):undefined,
      experience_years:role==='therapist'?Math.max(0,Math.min(60,Number(data.yearsOfExperience)||0)):undefined,
      hourly_rate:role==='therapist'?Math.max(0,Number(data.hourlyRate)||0):undefined,
      bio:role==='therapist'?(data.bio||''):undefined,
      title:role==='therapist'?(data.title||'Mental Health Practitioner'):undefined
    }}
  });
  if(error) return {success:false,error:error.message};
  if(!registered.user) return {success:false,error:'Signup was not completed.'};
  if(registered.session) revalidatePath('/','layout');
  return {success:true,needsEmailConfirmation:!registered.session,role};
}
export async function requestPasswordReset(email:string){
 const db=await createClient();
 if(!isValidEmail(email))return {message:'Enter a valid email address.'};
 const origin=process.env.NEXT_PUBLIC_SITE_URL||'https://mental-health-self-assessment.vercel.app';
 const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/callback?next=/reset-password'});
 if(error)return {message:'Recovery email could not be sent. Please try later.'};
 return {message:'If the address is registered, a recovery email is on the way.'};
}
export async function signOut() {
 const db=await createClient();
 await db.auth.signOut();
 revalidatePath('/','layout');
 redirect('/login');
}
