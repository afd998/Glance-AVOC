export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
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
      events: {
        Row: {
          created_at: string
          date: string | null
          end_time: string | null
          event_name: string | null
          event_type: string | null
          id: number
          instructor_name: string | null
          item_id: number | null
          item_id2: number | null
          lecture_title: string | null
          man_owner: string | null
          raw: Json | null
          resources: Json | null
          room_name: string | null
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
          instructor_name?: string | null
          item_id?: number | null
          item_id2?: number | null
          lecture_title?: string | null
          man_owner?: string | null
          raw?: Json | null
          resources?: Json | null
          room_name?: string | null
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
          instructor_name?: string | null
          item_id?: number | null
          item_id2?: number | null
          lecture_title?: string | null
          man_owner?: string | null
          raw?: Json | null
          resources?: Json | null
          room_name?: string | null
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
          complexity: number | null
          created_at: string
          id: number
          kelloggdirectory_bio: string | null
          kelloggdirectory_bio_url: string | null
          kelloggdirectory_image_url: string | null
          kelloggdirectory_name: string | null
          kelloggdirectory_subtitle: string | null
          kelloggdirectory_title: string | null
          left_source: string | null
          right_source: string | null
          setup_notes: string | null
          temperment: number | null
          timing: number | null
          twentyfivelive_name: string | null
          updated_at: string | null
          uses_mic: boolean | null
        }
        Insert: {
          complexity?: number | null
          created_at?: string
          id?: number
          kelloggdirectory_bio?: string | null
          kelloggdirectory_bio_url?: string | null
          kelloggdirectory_image_url?: string | null
          kelloggdirectory_name?: string | null
          kelloggdirectory_subtitle?: string | null
          kelloggdirectory_title?: string | null
          left_source?: string | null
          right_source?: string | null
          setup_notes?: string | null
          temperment?: number | null
          timing?: number | null
          twentyfivelive_name?: string | null
          updated_at?: string | null
          uses_mic?: boolean | null
        }
        Update: {
          complexity?: number | null
          created_at?: string
          id?: number
          kelloggdirectory_bio?: string | null
          kelloggdirectory_bio_url?: string | null
          kelloggdirectory_image_url?: string | null
          kelloggdirectory_name?: string | null
          kelloggdirectory_subtitle?: string | null
          kelloggdirectory_title?: string | null
          left_source?: string | null
          right_source?: string | null
          setup_notes?: string | null
          temperment?: number | null
          timing?: number | null
          twentyfivelive_name?: string | null
          updated_at?: string | null
          uses_mic?: boolean | null
        }
        Relationships: []
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
      ideas: {
        Row: {
          content: string | null
          created_at: string
          id: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
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
      push_subscriptions: {
        Row: {
          created_at: string
          id: number
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          subscription?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_hide: boolean
          current_filter: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          auto_hide?: boolean
          current_filter?: string | null
          id: string
          name?: string | null
          role?: string | null
        }
        Update: {
          auto_hide?: boolean
          current_filter?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      room_filters: {
        Row: {
          created_at: string
          default: boolean | null
          display: Json | null
          id: number
          name: string | null
          owner: string | null
        }
        Insert: {
          created_at?: string
          default?: boolean | null
          display?: Json | null
          id?: number
          name?: string | null
          owner?: string | null
        }
        Update: {
          created_at?: string
          default?: boolean | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
