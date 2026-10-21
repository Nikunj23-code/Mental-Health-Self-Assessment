export type user_role = 'patient' | 'therapist' | 'admin';
export type severity_level = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
export type assessment_type = 'PHQ-9' | 'GAD-7';
export type appointment_status = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type crisis_status = 'open' | 'active' | 'resolved' | 'escalated';

export interface Profile {
  id: string;
  role: user_role;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  gender?: string;
  preferred_language?: string;
  high_risk_flag?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TherapistProfile {
  id: string;
  user_id?: string;
  title?: string;
  bio?: string;
  license_number: string;
  license_document_url?: string;
  is_verified: boolean;
  specializations?: string[];
  specialties?: string[];
  years_of_experience?: number;
  experience_years?: number;
  languages?: string[];
  average_rating?: number;
  total_reviews?: number;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
  user?: Profile;
  profiles?: Profile;
}

export interface TherapistAvailability {
  id: string;
  therapist_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at?: string;
}

export interface AssessmentSchema {
  id: string;
  instrument_type?: string;
  type?: assessment_type;
  version: number;
  title: string;
  description: string;
  schema_json: {
    instructions: string;
    scale: Array<{ value: number; label: string }>;
    questions: Array<{ key: string; text: string; is_crisis_trigger?: boolean }>;
    adaptiveRules?: Array<{
      ruleId: string;
      triggerOn: string[];
      condition: string;
      action: string;
    }>;
  };
  is_active?: boolean;
  created_at?: string;
}

export interface Assessment {
  id: string;
  patient_id: string;
  schema_id?: string;
  assessment_type: assessment_type;
  type?: assessment_type;
  total_score: number;
  severity_band: string;
  severity?: severity_level;
  crisis_flag: boolean;
  has_crisis_flag?: boolean;
  completed_at: string;
  created_at?: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id?: string;
  question_key?: string;
  question_text?: string;
  response_value?: number;
  score_value?: number;
  created_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  therapist_id: string;
  availability_slot_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  created_at?: string;
  updated_at?: string;
  therapist?: TherapistProfile;
  patient?: Profile;
}

export interface SessionNote {
  id: string;
  appointment_id: string;
  therapist_id: string;
  patient_id: string;
  session_date?: string;
  shared_summary?: string;
  homework_assigned?: string;
  subjective_notes?: string;
  objective_observations?: string;
  assessment_diagnosis?: string;
  plan_homework?: string;
  mood_rating?: number;
  risk_assessment?: string;
  is_shared_with_patient?: boolean;
  shared_with_patient?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrisisLog {
  id: string;
  patient_id: string;
  assessment_id: string;
  item_score: number;
  status: string;
  safety_plan_acknowledged?: boolean;
  assigned_therapist_id?: string;
  resolution_notes?: string;
  created_at?: string;
  resolved_at?: string;
  patient?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  is_read?: boolean;
  link?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_affected: string;
  record_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at?: string;
  user?: Profile;
}

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string; full_name: string };
        Update: Partial<Profile>;
        Relationships: any[];
      };
      therapist_profiles: {
        Row: TherapistProfile;
        Insert: Partial<TherapistProfile>;
        Update: Partial<TherapistProfile>;
        Relationships: any[];
      };
      therapist_availability: {
        Row: TherapistAvailability;
        Insert: Partial<TherapistAvailability>;
        Update: Partial<TherapistAvailability>;
        Relationships: any[];
      };
      assessment_schemas: {
        Row: AssessmentSchema;
        Insert: Partial<AssessmentSchema>;
        Update: Partial<AssessmentSchema>;
        Relationships: any[];
      };
      assessments: {
        Row: Assessment;
        Insert: Partial<Assessment>;
        Update: Partial<Assessment>;
        Relationships: any[];
      };
      assessment_responses: {
        Row: AssessmentResponse;
        Insert: Partial<AssessmentResponse>;
        Update: Partial<AssessmentResponse>;
        Relationships: any[];
      };
      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment>;
        Update: Partial<Appointment>;
        Relationships: any[];
      };
      session_notes: {
        Row: SessionNote;
        Insert: Partial<SessionNote>;
        Update: Partial<SessionNote>;
        Relationships: any[];
      };
      crisis_logs: {
        Row: CrisisLog;
        Insert: Partial<CrisisLog>;
        Update: Partial<CrisisLog>;
        Relationships: any[];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
        Relationships: any[];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: any[];
      };
    };
  };
}
