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
      academic_calendar: {
        Row: {
          date: string | null
          date_string: string | null
          id: number
          label: string | null
          start_of_quarter: boolean
        }
        Insert: {
          date?: string | null
          date_string?: string | null
          id?: number
          label?: string | null
          start_of_quarter?: boolean
        }
        Update: {
          date?: string | null
          date_string?: string | null
          id?: number
          label?: string | null
          start_of_quarter?: boolean
        }
        Relationships: []
      }
      event_tasks: {
        Row: {
          created_at: string
          event: number | null
          id: number
          start_time: string | null
          status: string | null
          task_id: number | null
        }
        Insert: {
          created_at?: string
          event?: number | null
          id?: number
          start_time?: string | null
          status?: string | null
          task_id?: number | null
        }
        Update: {
          created_at?: string
          event?: number | null
          id?: number
          start_time?: string | null
          status?: string | null
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_services_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string | null
          end_time: string | null
          event_name: string | null
          event_type: string | null
          id: number
          instructor_names: Json | null
          item_id: number | null
          item_id2: number | null
          lecture_title: string | null
          man_owner: string | null
          organization: string | null
          raw: Json | null
          resources: Json | null
          room_name: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: number
          instructor_names?: Json | null
          item_id?: number | null
          item_id2?: number | null
          lecture_title?: string | null
          man_owner?: string | null
          organization?: string | null
          raw?: Json | null
          resources?: Json | null
          room_name: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          end_time?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: number
          instructor_names?: Json | null
          item_id?: number | null
          item_id2?: number | null
          lecture_title?: string | null
          man_owner?: string | null
          organization?: string | null
          raw?: Json | null
          resources?: Json | null
          room_name?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_man_owner_fkey"
            columns: ["man_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty: {
        Row: {
          created_at: string
          cutout_image: string | null
          id: number
          kelloggdirectory_bio: string | null
          kelloggdirectory_bio_url: string | null
          kelloggdirectory_image_url: string | null
          kelloggdirectory_name: string | null
          kelloggdirectory_subtitle: string | null
          kelloggdirectory_title: string | null
          twentyfivelive_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          cutout_image?: string | null
          id?: number
          kelloggdirectory_bio?: string | null
          kelloggdirectory_bio_url?: string | null
          kelloggdirectory_image_url?: string | null
          kelloggdirectory_name?: string | null
          kelloggdirectory_subtitle?: string | null
          kelloggdirectory_title?: string | null
          twentyfivelive_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          cutout_image?: string | null
          id?: number
          kelloggdirectory_bio?: string | null
          kelloggdirectory_bio_url?: string | null
          kelloggdirectory_image_url?: string | null
          kelloggdirectory_name?: string | null
          kelloggdirectory_subtitle?: string | null
          kelloggdirectory_title?: string | null
          twentyfivelive_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faculty_byods: {
        Row: {
          created_at: string
          faculty: number | null
          id: number
          name: string | null
          os: string | null
        }
        Insert: {
          created_at?: string
          faculty?: number | null
          id?: number
          name?: string | null
          os?: string | null
        }
        Update: {
          created_at?: string
          faculty?: number | null
          id?: number
          name?: string | null
          os?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_byods_faculty_fkey"
            columns: ["faculty"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_setup: {
        Row: {
          created_at: string
          faculty: number
          id: string
          left_device: number | null
          left_source: string | null
          mirroring360: boolean | null
          name: string | null
          notes: string | null
          right_device: number | null
          right_source: string | null
          updated_at: string | null
          uses_mic: boolean | null
        }
        Insert: {
          created_at?: string
          faculty?: number
          id?: string
          left_device?: number | null
          left_source?: string | null
          mirroring360?: boolean | null
          name?: string | null
          notes?: string | null
          right_device?: number | null
          right_source?: string | null
          updated_at?: string | null
          uses_mic?: boolean | null
        }
        Update: {
          created_at?: string
          faculty?: number
          id?: string
          left_device?: number | null
          left_source?: string | null
          mirroring360?: boolean | null
          name?: string | null
          notes?: string | null
          right_device?: number | null
          right_source?: string | null
          updated_at?: string | null
          uses_mic?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_setup_faculty_fkey"
            columns: ["faculty"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_setup_left_device_fkey"
            columns: ["left_device"]
            isOneToOne: false
            referencedRelation: "faculty_byods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_setup_right_device_fkey"
            columns: ["right_device"]
            isOneToOne: false
            referencedRelation: "faculty_byods"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_updates: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          faculty: number | null
          id: number
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          faculty?: number | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          faculty?: number | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          event_id: number | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_id?: number | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_id?: number | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          about: string | null
          created_at: string
          id: number
          logo: string | null
          name: string | null
          url: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          id?: number
          logo?: string | null
          name?: string | null
          url?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          id?: number
          logo?: string | null
          name?: string | null
          url?: string | null
        }
        Relationships: []
      }
      panopto_checks: {
        Row: {
          check_time: string
          completed_by_user_id: string | null
          completed_time: string | null
          created_at: string | null
          event_id: number
          id: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          check_time: string
          completed_by_user_id?: string | null
          completed_time?: string | null
          created_at?: string | null
          event_id: number
          id?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          check_time?: string
          completed_by_user_id?: string | null
          completed_time?: string | null
          created_at?: string | null
          event_id?: number
          id?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panopto_checks_completed_by_user_id_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panopto_checks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_hide: boolean
          bg: string | null
          color: string | null
          current_filter: string | null
          id: string
          name: string | null
          pixels_per_min: number | null
          roles: Json
          row_height: number | null
          theme: string
          zoom: number | null
        }
        Insert: {
          auto_hide?: boolean
          bg?: string | null
          color?: string | null
          current_filter?: string | null
          id: string
          name?: string | null
          pixels_per_min?: number | null
          roles?: Json
          row_height?: number | null
          theme?: string
          zoom?: number | null
        }
        Update: {
          auto_hide?: boolean
          bg?: string | null
          color?: string | null
          current_filter?: string | null
          id?: string
          name?: string | null
          pixels_per_min?: number | null
          roles?: Json
          row_height?: number | null
          theme?: string
          zoom?: number | null
        }
        Relationships: []
      }
      room_filters: {
        Row: {
          created_at: string
          display: Json | null
          id: number
          name: string | null
          owner: string | null
        }
        Insert: {
          created_at?: string
          display?: Json | null
          id?: number
          name?: string | null
          owner?: string | null
        }
        Update: {
          created_at?: string
          display?: Json | null
          id?: number
          name?: string | null
          owner?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: number
          name: string
          spelling: string | null
          sub_type: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          spelling?: string | null
          sub_type?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          spelling?: string | null
          sub_type?: string | null
          type?: string | null
        }
        Relationships: []
      }
      shift_blocks: {
        Row: {
          assignments: Json | null
          created_at: string
          date: string | null
          end_time: string | null
          id: number
          start_time: string | null
        }
        Insert: {
          assignments?: Json | null
          created_at?: string
          date?: string | null
          end_time?: string | null
          id?: number
          start_time?: string | null
        }
        Update: {
          assignments?: Json | null
          created_at?: string
          date?: string | null
          end_time?: string | null
          id?: number
          start_time?: string | null
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          date: string | null
          end_time: string | null
          id: number
          profile_id: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          end_time?: string | null
          id?: number
          profile_id?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          end_time?: string | null
          id?: number
          profile_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_missed_panopto_checks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
