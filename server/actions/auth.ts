'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { user_role } from '@/types/database';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role?: user_role;
  preferredLanguage?: string;
  licenseNumber?: string;
  specializations?: string[];
  yearsOfExperience?: number;
  hourlyRate?: number;
  bio?: string;
  title?: string;
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Fetch role
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const role = (profile as any)?.role || 'patient';
  redirect(`/${role}`);
}

export async function signUp(inputOrFormData: FormData | SignUpInput) {
  let email = '';
  let password = '';
  let fullName = '';
  let role: user_role = 'patient';
  let preferredLanguage = 'English';
  let licenseNumber = '';
  let specializations: string[] = ['Depression', 'Generalized Anxiety'];
  let yearsOfExperience = 3;
  let hourlyRate = 1500;
  let bio = 'Dedicated mental health professional.';

  if (inputOrFormData instanceof FormData) {
    email = inputOrFormData.get('email') as string;
    password = inputOrFormData.get('password') as string;
    fullName = inputOrFormData.get('fullName') as string;
    role = (inputOrFormData.get('role') as user_role) || 'patient';
    preferredLanguage = (inputOrFormData.get('preferredLanguage') as string) || 'English';
    licenseNumber = (inputOrFormData.get('licenseNumber') as string) || '';
    bio = (inputOrFormData.get('bio') as string) || bio;
  } else {
    email = inputOrFormData.email;
    password = inputOrFormData.password;
    fullName = inputOrFormData.fullName;
    role = inputOrFormData.role || 'patient';
    preferredLanguage = inputOrFormData.preferredLanguage || 'English';
    licenseNumber = inputOrFormData.licenseNumber || '';
    specializations = inputOrFormData.specializations || specializations;
    yearsOfExperience = inputOrFormData.yearsOfExperience || 3;
    hourlyRate = inputOrFormData.hourlyRate || 1500;
    bio = inputOrFormData.bio || bio;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Insert initial profile
    await (supabase as any).from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    });

    if (role === 'therapist') {
      await (supabase as any).from('therapist_profiles').insert({
        user_id: data.user.id,
        bio,
        license_number: licenseNumber || `RCI-${Date.now().toString().slice(-6)}`,
        is_verified: false,
        specializations,
        years_of_experience: yearsOfExperience,
        average_rating: 5.0,
        total_reviews: 0,
        hourly_rate: hourlyRate,
      });
    }

    await (supabase as any).from('audit_logs').insert({
      user_id: data.user.id,
      action: 'USER_SIGNUP',
      table_affected: 'profiles',
      record_id: data.user.id,
      metadata: { role, email },
    });
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
