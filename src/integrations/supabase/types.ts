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
      profiles: {
        Row: {
          created_at: string
          id: string
          mentoria_completed: boolean
          name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentoria_completed?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentoria_completed?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string | null
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
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
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
          plan: Database["public"]["Enums"]["subscription_plan"]
          polar_customer_id: string | null
          polar_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
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
      create_admin_user: {
        Args: { admin_user_id: string }
        Returns: boolean
      }
      has_active_premium: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_jwt: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_admin_user_id: string
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
      resource_access_level: ["public", "authenticated", "premium"],
      resource_visibility: ["public", "conditional"],
      subscription_plan: ["free", "premium"],
      subscription_status: ["active", "inactive", "cancelled"],
    },
  },
} as const
