-- Synced from the applied Supabase migration history. Do not reapply to the live database.

-- Therapist may read the identity (not private contact details) of patients who booked them;
-- clients' clinical records remain separately scoped by assessment RLS.
DROP POLICY IF EXISTS "Assigned therapist can view booked patient profile" ON public.profiles;
CREATE POLICY "Assigned therapist can view booked patient profile" ON public.profiles FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.appointments a WHERE a.patient_id=profiles.id
AND a.therapist_id=(select auth.uid()) AND a.status IN ('scheduled','completed')));

-- Safety cases must be resolved by reviewed administrators, not through unrestricted table updates.
CREATE OR REPLACE FUNCTION public.resolve_crisis_case(p_case_id uuid,p_notes text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid:=auth.uid(); n integer;
BEGIN
 IF uid IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin authorization required'; END IF;
 IF length(trim(coalesce(p_notes,'')))<5 THEN RAISE EXCEPTION 'Document a meaningful case resolution'; END IF;
 UPDATE public.crisis_logs SET status='resolved',resolution_notes=left(p_notes,4000),
 resolved_at=now() WHERE id=p_case_id AND status IN ('active','escalated');
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Active incident not found'; END IF;
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id)
 VALUES(uid,'CRISIS_CASE_REVIEWED','crisis_logs',p_case_id);
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_crisis_case(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_crisis_case(uuid,text) TO authenticated;

-- Prevent false 5-star verified ratings for zero reviews.
UPDATE public.therapist_profiles SET average_rating=0 WHERE total_reviews=0;
ALTER TABLE public.therapist_profiles ALTER COLUMN average_rating SET DEFAULT 0;

-- Restrict who can read visit notes and prevent invalid patient-note disclosure.
DROP POLICY IF EXISTS "Therapists can manage notes for their sessions" ON public.session_notes;
CREATE POLICY "Assigned therapist can read their notes" ON public.session_notes FOR SELECT TO authenticated
USING (therapist_id=(select auth.uid()) AND EXISTS(
 SELECT 1 FROM public.appointments a WHERE a.id=appointment_id AND a.therapist_id=(select auth.uid())
));

-- Scoped emergency audit record access; no direct writes.
DROP POLICY IF EXISTS "System/Patient can insert crisis incident" ON public.crisis_logs;
DROP POLICY IF EXISTS "Admins and therapists can update crisis resolution" ON public.crisis_logs;

-- Do not allow untrusted user-provided audit events or notifications through legacy policies.
DROP POLICY IF EXISTS "System can append audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

