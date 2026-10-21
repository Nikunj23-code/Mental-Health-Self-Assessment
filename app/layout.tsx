import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'MindAlign — Evidence-Based Mental Health & Intelligent Therapist Matching',
  description: 'Adaptive PHQ-9 & GAD-7 assessment, explainable therapist matching, conflict-free booking, and longitudinal measurement-based care.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole;
  let userName;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const p = profile as any;
    userRole = p?.role;
    userName = p?.full_name;
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar isLoggedIn={!!user} userRole={userRole} userName={userName} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-700">MindAlign Health Platform</span> © 2026. Built with Next.js, Supabase & Vercel.
            </div>
            <div className="flex items-center gap-4">
              <span>National Crisis Line: <strong>14416 (Tele-MANAS)</strong></span>
              <span>•</span>
              <span>Emergency: <strong>988</strong></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
