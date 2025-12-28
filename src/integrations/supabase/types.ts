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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_result: Json
          assessment_values: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_result: Json
          assessment_values: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_result?: Json
          assessment_values?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assessments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_rate_limit: {
        Row: {
          created_at: string | null
          first_request_at: string | null
          id: string
          identifier: string
          last_request_at: string | null
          request_count: number | null
        }
        Insert: {
          created_at?: string | null
          first_request_at?: string | null
          id?: string
          identifier: string
          last_request_at?: string | null
          request_count?: number | null
        }
        Update: {
          created_at?: string | null
          first_request_at?: string | null
          id?: string
          identifier?: string
          last_request_at?: string | null
          request_count?: number | null
        }
        Relationships: []
      }
      dismissed_recommended_objectives: {
        Row: {
          dismissed_at: string | null
          id: string
          objective_key: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          id?: string
          objective_key: string
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          id?: string
          objective_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_recommended_objectives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json
          event_name: string
          id: string
          lemon_squeezy_customer_id: string | null
          lemon_squeezy_order_id: string | null
          lemon_squeezy_subscription_id: string | null
          processing_time_ms: number | null
          status: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data: Json
          event_name: string
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_order_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          processing_time_ms?: number | null
          status?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json
          event_name?: string
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_order_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          processing_time_ms?: number | null
          status?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_mentoria_date: string | null
          mentoria_completed: boolean
          name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_mentoria_date?: string | null
          mentoria_completed?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_mentoria_date?: string | null
          mentoria_completed?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      progress_objectives: {
        Row: {
          access_level: Database["public"]["Enums"]["progress_objective_access_level"]
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          level: Json | null
          steps: Json
          summary: string
          timeframe: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["progress_objective_access_level"]
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          level?: Json | null
          steps?: Json
          summary: string
          timeframe: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["progress_objective_access_level"]
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          level?: Json | null
          steps?: Json
          summary?: string
          timeframe?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          access_level: Database["public"]["Enums"]["resource_access_level"]
          bucket_name: string
          condition_domain: string | null
          condition_max_level: number | null
          condition_min_level: number | null
          created_at: string
          display_order: number
          file_url: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          visibility_type: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["resource_access_level"]
          bucket_name?: string
          condition_domain?: string | null
          condition_max_level?: number | null
          condition_min_level?: number | null
          created_at?: string
          display_order?: number
          file_url: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          visibility_type?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          access_level?: Database["public"]["Enums"]["resource_access_level"]
          bucket_name?: string
          condition_domain?: string | null
          condition_max_level?: number | null
          condition_min_level?: number | null
          created_at?: string
          display_order?: number
          file_url?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          visibility_type?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: []
      }
      security_audit: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      starterpack_resources: {
        Row: {
          access_type: string
          audience: string
          bucket_name: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_estimate: string | null
          file_path: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          level: string | null
          slug: string
          step_order: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          access_type: string
          audience: string
          bucket_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_estimate?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          slug: string
          step_order?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          audience?: string
          bucket_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_estimate?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          slug?: string
          step_order?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_dedicated_resources: {
        Row: {
          bucket_name: string | null
          created_at: string | null
          created_by_admin: string | null
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          resource_name: string
          resource_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bucket_name?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          resource_name: string
          resource_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bucket_name?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          resource_name?: string
          resource_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dedicated_resources_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dedicated_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercises: {
        Row: {
          admin_feedback: string | null
          assigned_by_admin: string | null
          attachment_url: string | null
          created_at: string
          delivery_method: string | null
          due_date: string | null
          exercise_description: string | null
          exercise_title: string
          exercise_type: string | null
          id: string
          status: string | null
          submission_date: string | null
          submission_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          assigned_by_admin?: string | null
          attachment_url?: string | null
          created_at?: string
          delivery_method?: string | null
          due_date?: string | null
          exercise_description?: string | null
          exercise_title?: string
          exercise_type?: string | null
          id?: string
          status?: string | null
          submission_date?: string | null
          submission_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          assigned_by_admin?: string | null
          attachment_url?: string | null
          created_at?: string
          delivery_method?: string | null
          due_date?: string | null
          exercise_description?: string | null
          exercise_title?: string
          exercise_type?: string | null
          id?: string
          status?: string | null
          submission_date?: string | null
          submission_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exercises_assigned_by_admin_fkey"
            columns: ["assigned_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mentoria_opportunities: {
        Row: {
          created_at: string | null
          created_by_admin: string | null
          current_level: number | null
          display_order: number | null
          id: string
          notes: string | null
          opportunity_key: string
          opportunity_label: string
          target_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_admin?: string | null
          current_level?: number | null
          display_order?: number | null
          id?: string
          notes?: string | null
          opportunity_key: string
          opportunity_label: string
          target_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by_admin?: string | null
          current_level?: number | null
          display_order?: number | null
          id?: string
          notes?: string | null
          opportunity_key?: string
          opportunity_label?: string
          target_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mentoria_opportunities_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mentoria_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mentoria_recommendations: {
        Row: {
          created_at: string | null
          created_by_admin: string | null
          description: string | null
          display_order: number | null
          id: string
          priority: string | null
          skill_name: string
          skill_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_admin?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          priority?: string | null
          skill_name: string
          skill_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by_admin?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          priority?: string | null
          skill_name?: string
          skill_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mentoria_recommendations_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mentoria_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_objectives: {
        Row: {
          assigned_by_admin: string | null
          created_at: string
          due_date: string | null
          id: string
          is_locked: boolean | null
          level: Json | null
          locked_at: string | null
          mentor_notes: string | null
          objective_id: string | null
          position: number | null
          source: string
          status: string
          steps: Json
          summary: string
          timeframe: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by_admin?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          level?: Json | null
          locked_at?: string | null
          mentor_notes?: string | null
          objective_id?: string | null
          position?: number | null
          source: string
          status?: string
          steps?: Json
          summary: string
          timeframe: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by_admin?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_locked?: boolean | null
          level?: Json | null
          locked_at?: string | null
          mentor_notes?: string | null
          objective_id?: string | null
          position?: number | null
          source?: string
          status?: string
          steps?: Json
          summary?: string
          timeframe?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_objectives_assigned_by_admin_fkey"
            columns: ["assigned_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_objectives_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "progress_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_objectives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          lemon_squeezy_customer_id: string | null
          lemon_squeezy_order_id: string | null
          lemon_squeezy_subscription_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_order_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          lemon_squeezy_customer_id?: string | null
          lemon_squeezy_order_id?: string | null
          lemon_squeezy_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
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
      admin_toggle_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_target_profile_id: string
        }
        Returns: Json
      }
      admin_update_mentoria_status: {
        Args: { p_new_status: boolean; p_target_profile_id: string }
        Returns: Json
      }
      admin_update_subscription: {
        Args: {
          p_new_plan: Database["public"]["Enums"]["subscription_plan"]
          p_notes?: string
          p_target_profile_id: string
        }
        Returns: Json
      }
      bootstrap_first_admin: {
        Args: { admin_user_id: string }
        Returns: boolean
      }
      clean_old_rate_limits: { Args: never; Returns: undefined }
      create_admin_user: { Args: { admin_user_id: string }; Returns: boolean }
      ensure_user_defaults: { Args: never; Returns: undefined }
      get_profile_id_for_auth: { Args: never; Returns: string }
      has_active_premium: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_jwt: { Args: { check_user_id?: string }; Returns: boolean }
      is_assessment_owner: {
        Args: { assessment_user_id: string }
        Returns: boolean
      }
      log_admin_action:
        | {
            Args: {
              p_action_type: string
              p_admin_user_id: string
              p_details?: Json
              p_target_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_action_type: string
              p_details?: Json
              p_target_user_id: string
            }
            Returns: string
          }
      log_security_event: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      progress_objective_access_level: "free" | "premium"
      resource_access_level: "public" | "authenticated" | "premium"
      resource_visibility: "public" | "conditional"
      subscription_plan: "free" | "premium"
      subscription_status: "active" | "inactive" | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
      progress_objective_access_level: ["free", "premium"],
      resource_access_level: ["public", "authenticated", "premium"],
      resource_visibility: ["public", "conditional"],
      subscription_plan: ["free", "premium"],
      subscription_status: ["active", "inactive", "cancelled"],
    },
  },
} as const
