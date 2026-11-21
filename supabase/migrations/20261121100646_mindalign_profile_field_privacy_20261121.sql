-- Synced from applied live migration history.

-- Restrict global profile field access; row-level policies alone do not hide columns.
REVOKE SELECT ON public.profiles FROM anon,authenticated;
GRANT SELECT (id,role,full_name,avatar_url,preferred_language,high_risk_flag,created_at,updated_at)
ON public.profiles TO authenticated;

-- Restricted admin-only directory of contact addresses, not exposed through public profiles reads.
CREATE OR REPLACE FUNCTION public.admin_contact_profiles()
RETURNS TABLE(id uuid,full_name text,email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT p.id,p.full_name,p.email FROM public.profiles p
 WHERE auth.uid() IS NOT NULL AND public.is_admin();
$$;
REVOKE ALL ON FUNCTION public.admin_contact_profiles() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_contact_profiles() TO authenticated;

-- Avoid sensitive fields being returned by an unspecific REST request.
REVOKE SELECT ON public.therapist_profiles FROM anon;

