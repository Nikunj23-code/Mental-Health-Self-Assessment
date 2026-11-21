export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          availability_slot_id: string
          cancellation_reason: string | null
          created_at: string
          end_time: string
          id: string
          meeting_link: string
          patient_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          therapist_id: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          availability_slot_id: string
          cancellation_reason?: string | null
          created_at?: string
          end_time: string
          id?: string
          meeting_link?: string
          patient_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          availability_slot_id?: string
          cancellation_reason?: string | null
          created_at?: string
          end_time?: string
          id?: string
          meeting_link?: string
          patient_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_availability_slot_id_fkey"
            columns: ["availability_slot_id"]
            isOneToOne: false
            referencedRelation: "therapist_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          question_key: string
          question_text: string
          score_value: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          question_key: string
          question_text: string
          score_value: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          question_key?: string
          question_text?: string
          score_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_schemas: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          schema_json: Json
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
          version: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          schema_json: Json
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
          version?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          schema_json?: Json
          title?: string
          type?: Database["public"]["Enums"]["assessment_type"]
          version?: number
        }
        Relationships: []
      }
      assessments: {
        Row: {
          created_at: string
          has_crisis_flag: boolean
          id: string
          patient_id: string
          schema_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          total_score: number
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Insert: {
          created_at?: string
          has_crisis_flag?: boolean
          id?: string
          patient_id: string
          schema_id: string
          severity: Database["public"]["Enums"]["severity_level"]
          total_score: number
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Update: {
          created_at?: string
          has_crisis_flag?: boolean
          id?: string
          patient_id?: string
          schema_id?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          total_score?: number
          type?: Database["public"]["Enums"]["assessment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "assessment_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_affected: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_affected: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_affected?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_logs: {
        Row: {
          assessment_id: string
          assigned_therapist_id: string | null
          created_at: string
          id: string
          item_score: number
          patient_id: string
          resolution_notes: string | null
          resolved_at: string | null
          safety_plan_acknowledged: boolean
          status: Database["public"]["Enums"]["crisis_status"]
        }
        Insert: {
          assessment_id: string
          assigned_therapist_id?: string | null
          created_at?: string
          id?: string
          item_score: number
          patient_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          safety_plan_acknowledged?: boolean
          status?: Database["public"]["Enums"]["crisis_status"]
        }
        Update: {
          assessment_id?: string
          assigned_therapist_id?: string | null
          created_at?: string
          id?: string
          item_score?: number
          patient_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          safety_plan_acknowledged?: boolean
          status?: Database["public"]["Enums"]["crisis_status"]
        }
        Relationships: [
          {
            foreignKeyName: "crisis_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_logs_assigned_therapist_id_fkey"
            columns: ["assigned_therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          recipient_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          gender: string | null
          high_risk_flag: boolean
          id: string
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          gender?: string | null
          high_risk_flag?: boolean
          id: string
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          high_risk_flag?: boolean
          id?: string
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      screening_safety_events: {
        Row: {
          acknowledged_at: string | null
          assessment_id: string | null
          client_event_id: string
          created_at: string
          id: string
          item_score: number
          patient_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          assessment_id?: string | null
          client_event_id: string
          created_at?: string
          id?: string
          item_score: number
          patient_id: string
        }
        Update: {
          acknowledged_at?: string | null
          assessment_id?: string | null
          client_event_id?: string
          created_at?: string
          id?: string
          item_score?: number
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_safety_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_safety_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_notes: {
        Row: {
          appointment_id: string
          assessment_diagnosis: string
          created_at: string
          id: string
          is_shared_with_patient: boolean
          mood_rating: number
          objective_observations: string
          patient_id: string
          plan_homework: string
          risk_assessment: string
          subjective_notes: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          assessment_diagnosis: string
          created_at?: string
          id?: string
          is_shared_with_patient?: boolean
          mood_rating: number
          objective_observations: string
          patient_id: string
          plan_homework: string
          risk_assessment?: string
          subjective_notes: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          assessment_diagnosis?: string
          created_at?: string
          id?: string
          is_shared_with_patient?: boolean
          mood_rating?: number
          objective_observations?: string
          patient_id?: string
          plan_homework?: string
          risk_assessment?: string
          subjective_notes?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_notes_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          slot_date: string
          start_time: string
          therapist_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          slot_date: string
          start_time: string
          therapist_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          slot_date?: string
          start_time?: string
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_availability_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_profiles: {
        Row: {
          average_rating: number
          bio: string
          created_at: string
          experience_years: number
          hourly_rate: number
          id: string
          is_verified: boolean
          languages: string[]
          license_document_url: string | null
          license_number: string
          specialties: string[]
          title: string
          total_reviews: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          bio: string
          created_at?: string
          experience_years?: number
          hourly_rate?: number
          id: string
          is_verified?: boolean
          languages?: string[]
          license_document_url?: string | null
          license_number: string
          specialties?: string[]
          title: string
          total_reviews?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          bio?: string
          created_at?: string
          experience_years?: number
          hourly_rate?: number
          id?: string
          is_verified?: boolean
          languages?: string[]
          license_document_url?: string | null
          license_number?: string
          specialties?: string[]
          title?: string
          total_reviews?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_session: {
        Args: { p_slot_id: string; p_therapist_id: string }
        Returns: string
      }
      cancel_session: {
        Args: { p_appointment_id: string; p_reason: string }
        Returns: boolean
      }
      get_patient_shared_plans: {
        Args: never
        Returns: {
          appointment_id: string
          created_at: string
          id: string
          plan_homework: string
          therapist_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      record_item9_safety: {
        Args: {
          p_acknowledged?: boolean
          p_client_event_id: string
          p_item_score: number
        }
        Returns: string
      }
      resolve_crisis_case: {
        Args: { p_case_id: string; p_notes: string }
        Returns: boolean
      }
      review_therapist: {
        Args: { p_id: string; p_verified: boolean }
        Returns: boolean
      }
      save_session_note: {
        Args: {
          p_appointment_id: string
          p_assessment: string
          p_mood: number
          p_objective: string
          p_plan: string
          p_risk: string
          p_shared: boolean
          p_subjective: string
        }
        Returns: string
      }
      submit_screening: {
        Args: { p_answers: Json; p_type: string }
        Returns: Json
      }
    }
    Enums: {
      appointment_status: "scheduled" | "completed" | "cancelled" | "no_show"
      assessment_type: "PHQ-9" | "GAD-7"
      crisis_status: "active" | "resolved" | "escalated"
      severity_level:
        | "minimal"
        | "mild"
        | "moderate"
        | "moderately_severe"
        | "severe"
      user_role: "patient" | "therapist" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["scheduled", "completed", "cancelled", "no_show"],
      assessment_type: ["PHQ-9", "GAD-7"],
      crisis_status: ["active", "resolved", "escalated"],
      severity_level: [
        "minimal",
        "mild",
        "moderate",
        "moderately_severe",
        "severe",
      ],
      user_role: ["patient", "therapist", "admin"],
    },
  },
} as const


// Public enum aliases, generated from the actual PostgreSQL schema.
export type user_role = Database['public']['Enums']['user_role'];
export type severity_level = Database['public']['Enums']['severity_level'];
export type assessment_type = Database['public']['Enums']['assessment_type'];
export type appointment_status = Database['public']['Enums']['appointment_status'];
export type crisis_status = Database['public']['Enums']['crisis_status'];
