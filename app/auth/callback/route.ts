import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function GET(request:NextRequest) {
 const url=new URL(request.url);
 const code=url.searchParams.get('code');
 const next=url.searchParams.get('next')||'';
 if(!code)return NextResponse.redirect(new URL('/login?error=expired',url.origin));
 const db=await createClient();
 const {error}=await db.auth.exchangeCodeForSession(code);
 if(error)return NextResponse.redirect(new URL('/login?error=expired',url.origin));
 const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.redirect(new URL('/login?error=session',url.origin));
 if(next==='/reset-password')return NextResponse.redirect(new URL('/reset-password',url.origin));
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).single();
 const role=(profile as any)?.role;
 return NextResponse.redirect(new URL(['patient','therapist','admin'].includes(role)?'/'+role:'/login?error=profile',url.origin));
}
