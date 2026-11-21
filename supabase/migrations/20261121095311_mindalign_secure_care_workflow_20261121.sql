-- Synced from the applied Supabase migration history. Do not reapply to the live database.

-- MindAlign repair: permission boundaries, authenticated lifecycle, and atomic clinical operations.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::public.user_role) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Database-owned profile provisioning, with a strict public-signup role allowlist.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  desired_role public.user_role;
  license text;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
BEGIN
  desired_role := CASE WHEN meta->>'role' = 'therapist' THEN 'therapist'::public.user_role ELSE 'patient'::public.user_role END;
  INSERT INTO public.profiles (id, email, full_name, role, preferred_language)
  VALUES (new.id, new.email, left(coalesce(nullif(meta->>'full_name',''), 'New User'), 120), desired_role,
    left(coalesce(nullif(meta->>'preferred_language',''), 'English'), 40))
  ON CONFLICT(id) DO NOTHING;
  IF desired_role = 'therapist' THEN
    license := left(coalesce(nullif(trim(meta->>'license_number'),''), 'PENDING-' || new.id::text), 120);
    INSERT INTO public.therapist_profiles
      (id,title,bio,license_number,is_verified,specialties,experience_years,languages,hourly_rate,average_rating,total_reviews)
    VALUES (new.id, left(coalesce(nullif(meta->>'title',''), 'Mental Health Practitioner'),120),
      left(coalesce(nullif(meta->>'bio',''), 'Professional review pending.'), 2500),
      license, false,
      CASE WHEN jsonb_typeof(meta->'specialties')='array' THEN ARRAY(SELECT left(value,80) FROM jsonb_array_elements_text(meta->'specialties') AS value LIMIT 12) ELSE ARRAY[]::text[] END,
      greatest(0,least(60, CASE WHEN (meta->>'experience_years') ~ '^[0-9]{1,2}$' THEN (meta->>'experience_years')::int ELSE 0 END)),
      ARRAY['English']::text[],
      greatest(0,least(100000, CASE WHEN (meta->>'hourly_rate') ~ '^[0-9]{1,6}$' THEN (meta->>'hourly_rate')::numeric ELSE 0 END)),
      0,0)
    ON CONFLICT(id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- User-editable fields only. Prevent role promotion and clinician self-verification.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name,phone,avatar_url,gender,preferred_language,updated_at) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own safe profile fields" ON public.profiles FOR UPDATE TO authenticated
USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.therapist_profiles FROM anon, authenticated;
GRANT UPDATE (title,bio,specialties,experience_years,languages,hourly_rate,updated_at) ON public.therapist_profiles TO authenticated;
DROP POLICY IF EXISTS "Therapists can update own profile" ON public.therapist_profiles;
CREATE POLICY "Therapists can update allowed profile fields" ON public.therapist_profiles FOR UPDATE TO authenticated
USING (id = (select auth.uid()) AND NOT is_verified) WITH CHECK (id = (select auth.uid()) AND NOT is_verified);
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.crisis_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assessments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assessment_responses FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.session_notes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.appointments FROM anon, authenticated;
DROP POLICY IF EXISTS "Patients can view shared session notes" ON public.session_notes;

-- No active appointment should be duplicated, but a cancelled slot may be rebooked.
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_availability_slot_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_unique
 ON public.appointments(availability_slot_id) WHERE status IN ('scheduled','completed');

CREATE OR REPLACE FUNCTION public.handle_appointment_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.therapist_availability
    SET is_booked = true WHERE id = new.availability_slot_id
     AND therapist_id = new.therapist_id AND is_booked = false
     AND (slot_date + start_time) > (now() at time zone 'Asia/Kolkata');
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN RAISE EXCEPTION 'Slot unavailable or does not belong to clinician' USING ERRCODE = '22023'; END IF;
  RETURN new;
END; $$;
CREATE OR REPLACE FUNCTION public.handle_appointment_cancellation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
 IF new.status='cancelled' AND old.status <> 'cancelled' THEN
  UPDATE public.therapist_availability SET is_booked=false WHERE id=new.availability_slot_id;
 END IF;
 RETURN new;
END; $$;
REVOKE ALL ON FUNCTION public.handle_appointment_booking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_appointment_cancellation() FROM PUBLIC, anon, authenticated;

-- An immediate, idempotent private safety signal. It does not claim a clinician was contacted.
CREATE TABLE IF NOT EXISTS public.screening_safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_event_id uuid NOT NULL,
  item_score integer NOT NULL CHECK (item_score BETWEEN 1 AND 3),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(patient_id,client_event_id)
);
ALTER TABLE public.screening_safety_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.screening_safety_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.screening_safety_events TO authenticated;
CREATE POLICY "Patient can read own safety signals" ON public.screening_safety_events
FOR SELECT TO authenticated USING (patient_id = (select auth.uid()));

CREATE OR REPLACE FUNCTION public.record_item9_safety(p_client_event_id uuid,p_item_score integer,p_acknowledged boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid := auth.uid(); event_id uuid;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='patient') THEN RAISE EXCEPTION 'Patient sign-in required'; END IF;
 IF p_client_event_id IS NULL OR p_item_score NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Invalid safety signal'; END IF;
 INSERT INTO public.screening_safety_events(patient_id,client_event_id,item_score,acknowledged_at)
 VALUES(uid,p_client_event_id,p_item_score, CASE WHEN p_acknowledged THEN now() ELSE NULL END)
 ON CONFLICT (patient_id,client_event_id) DO UPDATE
  SET acknowledged_at=CASE WHEN p_acknowledged THEN coalesce(public.screening_safety_events.acknowledged_at,now()) ELSE public.screening_safety_events.acknowledged_at END
 RETURNING id INTO event_id;
 RETURN event_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_item9_safety(uuid,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_item9_safety(uuid,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_screening(p_type text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 uid uuid := auth.uid(); sid uuid; aid uuid; total integer:=0; n integer;
 i integer; qkey text; val text; sev public.severity_level; flagged boolean:=false; severity_label text;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='patient') THEN RAISE EXCEPTION 'Patient sign-in required'; END IF;
 IF p_type NOT IN ('PHQ-9','GAD-7') OR p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' THEN RAISE EXCEPTION 'Invalid screening instrument/answers'; END IF;
 n := CASE WHEN p_type='PHQ-9' THEN 9 ELSE 7 END;
 IF (SELECT count(*) FROM jsonb_object_keys(p_answers)) <> n THEN RAISE EXCEPTION 'Every question must be answered exactly once'; END IF;
 SELECT id INTO sid FROM public.assessment_schemas WHERE type=p_type::public.assessment_type AND is_active=true LIMIT 1;
 IF sid IS NULL THEN RAISE EXCEPTION 'Assessment schema currently unavailable'; END IF;
 FOR i IN 1..n LOOP
  qkey := CASE WHEN p_type='PHQ-9' THEN 'phq9_q' ELSE 'gad7_q' END || i::text;
  val := p_answers->>qkey;
  IF val IS NULL OR val !~ '^[0-3]$' THEN RAISE EXCEPTION 'Invalid score for question %', i; END IF;
  total:=total+val::int;
 END LOOP;
 flagged := p_type='PHQ-9' AND (p_answers->>'phq9_q9')::int > 0;
 IF p_type='PHQ-9' THEN
  sev := CASE WHEN total>=20 THEN 'severe' WHEN total>=15 THEN 'moderately_severe' WHEN total>=10 THEN 'moderate' WHEN total>=5 THEN 'mild' ELSE 'minimal' END::public.severity_level;
 ELSE
  sev := CASE WHEN total>=15 THEN 'severe' WHEN total>=10 THEN 'moderate' WHEN total>=5 THEN 'mild' ELSE 'minimal' END::public.severity_level;
 END IF;
 INSERT INTO public.assessments(patient_id,schema_id,type,total_score,severity,has_crisis_flag)
 VALUES(uid,sid,p_type::public.assessment_type,total,sev,flagged) RETURNING id INTO aid;
 FOR i IN 1..n LOOP
  qkey := CASE WHEN p_type='PHQ-9' THEN 'phq9_q' ELSE 'gad7_q' END || i::text;
  INSERT INTO public.assessment_responses(assessment_id,question_key,question_text,score_value)
  SELECT aid,qkey,coalesce((SELECT q->>'text' FROM public.assessment_schemas s,
        jsonb_array_elements(s.schema_json->'questions') q
        WHERE s.id=sid AND (q->>'key'=qkey OR q->>'id'=qkey) LIMIT 1),qkey),(p_answers->>qkey)::int;
 END LOOP;
 IF flagged THEN
  UPDATE public.profiles SET high_risk_flag=true WHERE id=uid;
  INSERT INTO public.crisis_logs(patient_id,assessment_id,item_score,status,safety_plan_acknowledged)
  VALUES(uid,aid,(p_answers->>'phq9_q9')::int,'active',false);
  UPDATE public.screening_safety_events SET assessment_id=aid
   WHERE id=(SELECT id FROM public.screening_safety_events WHERE patient_id=uid AND assessment_id IS NULL
      ORDER BY created_at DESC LIMIT 1);
 END IF;
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id,metadata)
 VALUES(uid,'ASSESSMENT_COMPLETED','assessments',aid,jsonb_build_object('instrument',p_type,'score',total,'severity',sev));
 RETURN jsonb_build_object('assessmentId',aid,'totalScore',total,'severityBand',sev,'crisisFlag',flagged);
END; $$;
REVOKE ALL ON FUNCTION public.submit_screening(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_screening(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.book_session(p_therapist_id uuid,p_slot_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid:=auth.uid(); sl public.therapist_availability%ROWTYPE; aid uuid;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=uid AND role='patient') THEN RAISE EXCEPTION 'Patient sign-in required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.therapist_profiles WHERE id=p_therapist_id AND is_verified) THEN RAISE EXCEPTION 'Clinician is not verified'; END IF;
 SELECT * INTO sl FROM public.therapist_availability WHERE id=p_slot_id AND therapist_id=p_therapist_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Slot does not belong to clinician'; END IF;
 IF sl.is_booked OR (sl.slot_date+sl.start_time) <= (now() at time zone 'Asia/Kolkata') THEN RAISE EXCEPTION 'Slot is no longer available'; END IF;
 INSERT INTO public.appointments(patient_id,therapist_id,availability_slot_id,appointment_date,start_time,end_time,status,meeting_link)
 VALUES(uid,p_therapist_id,p_slot_id,sl.slot_date,sl.start_time,sl.end_time,'scheduled',
  'https://meet.jit.si/MindAlignDemo-' || replace(gen_random_uuid()::text,'-',''))
 RETURNING id INTO aid;
 INSERT INTO public.notifications(recipient_id,title,message,type,link)
 VALUES(p_therapist_id,'New appointment','An appointment was scheduled for '||sl.slot_date::text,'appointment','/therapist');
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id)
 VALUES(uid,'APPOINTMENT_BOOKED','appointments',aid);
 RETURN aid;
END; $$;
REVOKE ALL ON FUNCTION public.book_session(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_session(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_session(p_appointment_id uuid,p_reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid:=auth.uid(); ap public.appointments%ROWTYPE;
BEGIN
 SELECT * INTO ap FROM public.appointments WHERE id=p_appointment_id FOR UPDATE;
 IF NOT FOUND OR uid IS NULL OR (ap.patient_id<>uid AND ap.therapist_id<>uid) THEN RAISE EXCEPTION 'Appointment not found'; END IF;
 IF ap.status<>'scheduled' OR (ap.appointment_date+ap.start_time) < (now() at time zone 'Asia/Kolkata') THEN RAISE EXCEPTION 'Appointment cannot be cancelled'; END IF;
 UPDATE public.appointments SET status='cancelled',cancellation_reason=left(coalesce(p_reason,''),500),updated_at=now() WHERE id=p_appointment_id;
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id)
 VALUES(uid,'APPOINTMENT_CANCELLED','appointments',p_appointment_id);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.cancel_session(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_session(uuid,text) TO authenticated;

-- Clinician-only note upsert; patient identity is derived from the assigned appointment.
CREATE OR REPLACE FUNCTION public.save_session_note(
 p_appointment_id uuid,p_subjective text,p_objective text,p_assessment text,p_plan text,
 p_mood integer,p_risk text,p_shared boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid:=auth.uid(); ap public.appointments%ROWTYPE; note_id uuid;
BEGIN
 SELECT * INTO ap FROM public.appointments WHERE id=p_appointment_id FOR UPDATE;
 IF uid IS NULL OR NOT FOUND OR ap.therapist_id<>uid OR ap.status NOT IN ('scheduled','completed')
   OR NOT EXISTS(SELECT 1 FROM public.therapist_profiles WHERE id=uid AND is_verified) THEN RAISE EXCEPTION 'Session access denied'; END IF;
 IF length(trim(coalesce(p_subjective,'')))<2 OR length(trim(coalesce(p_objective,'')))<2 OR
 length(trim(coalesce(p_assessment,'')))<2 OR length(trim(coalesce(p_plan,'')))<2 OR
 p_mood NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Complete clinical note required'; END IF;
 INSERT INTO public.session_notes(appointment_id,therapist_id,patient_id,subjective_notes,
 objective_observations,assessment_diagnosis,plan_homework,mood_rating,risk_assessment,is_shared_with_patient)
 VALUES(p_appointment_id,uid,ap.patient_id,left(p_subjective,10000),left(p_objective,10000),
  left(p_assessment,10000),left(p_plan,10000),p_mood,left(coalesce(p_risk,''),2000),coalesce(p_shared,false))
 ON CONFLICT(appointment_id) DO UPDATE SET subjective_notes=excluded.subjective_notes,
 objective_observations=excluded.objective_observations,assessment_diagnosis=excluded.assessment_diagnosis,
 plan_homework=excluded.plan_homework,mood_rating=excluded.mood_rating,risk_assessment=excluded.risk_assessment,
 is_shared_with_patient=excluded.is_shared_with_patient,updated_at=now()
 RETURNING id INTO note_id;
 UPDATE public.appointments SET status='completed',updated_at=now() WHERE id=p_appointment_id;
 IF coalesce(p_shared,false) THEN
   INSERT INTO public.notifications(recipient_id,title,message,type,link)
   VALUES(ap.patient_id,'Session plan available','Your clinician shared a follow-up plan.','info','/patient/progress');
 END IF;
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id)
 VALUES(uid,'SESSION_NOTE_SAVED','session_notes',note_id);
 RETURN note_id;
END; $$;
REVOKE ALL ON FUNCTION public.save_session_note(uuid,text,text,text,text,integer,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_session_note(uuid,text,text,text,text,integer,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_patient_shared_plans()
RETURNS TABLE(id uuid,appointment_id uuid,created_at timestamptz,plan_homework text,therapist_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT n.id,n.appointment_id,n.created_at,n.plan_homework,p.full_name
 FROM public.session_notes n JOIN public.profiles p ON p.id=n.therapist_id
 WHERE auth.uid() IS NOT NULL AND n.patient_id=auth.uid() AND n.is_shared_with_patient=true
 ORDER BY n.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.get_patient_shared_plans() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_patient_shared_plans() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_therapist(p_id uuid,p_verified boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin approval required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.therapist_profiles WHERE id=p_id) THEN RAISE EXCEPTION 'Therapist does not exist'; END IF;
 UPDATE public.therapist_profiles SET is_verified=p_verified,updated_at=now() WHERE id=p_id;
 INSERT INTO public.notifications(recipient_id,title,message,type)
 VALUES(p_id,'Credential review updated',CASE WHEN p_verified THEN 'Your therapist profile is approved.' ELSE 'Your therapist profile requires review.' END,'info');
 INSERT INTO public.audit_logs(user_id,action,table_affected,record_id,metadata)
 VALUES(uid,'THERAPIST_REVIEWED','therapist_profiles',p_id,jsonb_build_object('verified',p_verified));
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.review_therapist(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_therapist(uuid,boolean) TO authenticated;

