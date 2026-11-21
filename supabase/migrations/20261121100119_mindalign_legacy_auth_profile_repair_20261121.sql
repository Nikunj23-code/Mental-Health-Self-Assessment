-- Synced from the applied Supabase migration history. Do not reapply to the live database.

-- Repair previously missing auth-to-profile links. Never create admin from editable metadata.
INSERT INTO public.profiles(id, email, full_name,role,preferred_language)
SELECT u.id,u.email,left(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''),'Member'),120),
CASE WHEN u.raw_user_meta_data->>'role'='therapist' THEN 'therapist'::public.user_role ELSE 'patient'::public.user_role END,
'English'
FROM auth.users u LEFT JOIN public.profiles p ON p.id=u.id
WHERE p.id IS NULL AND u.email IS NOT NULL
ON CONFLICT(id) DO NOTHING;

-- Clinician onboarding records are unverified and cannot be self-approved.
INSERT INTO public.therapist_profiles(id,title,bio,license_number,is_verified,
 specialties,experience_years,languages,average_rating,total_reviews,hourly_rate)
SELECT p.id,'Mental Health Practitioner','Professional registration is awaiting review.',
'PENDING-'||p.id::text,false,ARRAY[]::text[],0,ARRAY['English']::text[],0,0,0
FROM public.profiles p LEFT JOIN public.therapist_profiles tp ON tp.id=p.id
WHERE p.role='therapist' AND tp.id IS NULL
ON CONFLICT(id) DO NOTHING;

