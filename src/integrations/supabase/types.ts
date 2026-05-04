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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      centres: {
        Row: {
          active: boolean
          city: string
          country_id: string
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["provider_type"]
          provider_url: string | null
        }
        Insert: {
          active?: boolean
          city: string
          country_id: string
          created_at?: string
          id?: string
          provider: Database["public"]["Enums"]["provider_type"]
          provider_url?: string | null
        }
        Update: {
          active?: boolean
          city?: string
          country_id?: string
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["provider_type"]
          provider_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centres_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          active: boolean
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          monthly_price_cents: number
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          monthly_price_cents?: number
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          monthly_price_cents?: number
          name?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          error: string | null
          id: string
          sent_at: string
          slot_event_id: string
          status: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          error?: string | null
          id?: string
          sent_at?: string
          slot_event_id: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          error?: string | null
          id?: string
          sent_at?: string
          slot_event_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_slot_event_id_fkey"
            columns: ["slot_event_id"]
            isOneToOne: false
            referencedRelation: "slot_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          channel_email: boolean
          channel_sms: boolean
          channel_telegram: boolean
          channel_web_push: boolean
          channel_whatsapp: boolean
          created_at: string
          full_name: string | null
          id: string
          phone_e164: string | null
          telegram_chat_id: string | null
          updated_at: string
        }
        Insert: {
          channel_email?: boolean
          channel_sms?: boolean
          channel_telegram?: boolean
          channel_web_push?: boolean
          channel_whatsapp?: boolean
          created_at?: string
          full_name?: string | null
          id: string
          phone_e164?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_email?: boolean
          channel_sms?: boolean
          channel_telegram?: boolean
          channel_web_push?: boolean
          channel_whatsapp?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          phone_e164?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scraper_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key_hash: string
          key_prefix: string | null
          last_heartbeat_at: string | null
          last_slot_at: string | null
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash: string
          key_prefix?: string | null
          last_heartbeat_at?: string | null
          last_slot_at?: string | null
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string | null
          last_heartbeat_at?: string | null
          last_slot_at?: string | null
          name?: string
        }
        Relationships: []
      }
      slot_events: {
        Row: {
          category_id: string
          centre_id: string
          created_at: string
          detected_at: string
          id: string
          raw_url: string | null
          scraper_id: string | null
          slot_date: string
          slot_time: string | null
          source: Database["public"]["Enums"]["slot_source"]
        }
        Insert: {
          category_id: string
          centre_id: string
          created_at?: string
          detected_at?: string
          id?: string
          raw_url?: string | null
          scraper_id?: string | null
          slot_date: string
          slot_time?: string | null
          source?: Database["public"]["Enums"]["slot_source"]
        }
        Update: {
          category_id?: string
          centre_id?: string
          created_at?: string
          detected_at?: string
          id?: string
          raw_url?: string | null
          scraper_id?: string | null
          slot_date?: string
          slot_time?: string | null
          source?: Database["public"]["Enums"]["slot_source"]
        }
        Relationships: [
          {
            foreignKeyName: "slot_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_events_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_events_scraper_id_fkey"
            columns: ["scraper_id"]
            isOneToOne: false
            referencedRelation: "scraper_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_reports: {
        Row: {
          category_id: string
          centre_id: string
          created_at: string
          id: string
          notes: string | null
          screenshot_url: string | null
          slot_date: string
          slot_time: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          category_id: string
          centre_id: string
          created_at?: string
          id?: string
          notes?: string | null
          screenshot_url?: string | null
          slot_date: string
          slot_time?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          category_id?: string
          centre_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          screenshot_url?: string | null
          slot_date?: string
          slot_time?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "slot_reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_reports_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          country_id: string
          created_at: string
          current_period_end: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trackers: {
        Row: {
          active: boolean
          alert_window: Json
          category_id: string
          centre_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          alert_window?: Json
          category_id: string
          centre_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          alert_window?: Json
          category_id?: string
          centre_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trackers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trackers_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "centres"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: never; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      heartbeat_scraper: { Args: { _scraper_id: string }; Returns: undefined }
      ingest_slot_event: {
        Args: {
          _category_id: string
          _centre_id: string
          _raw_url: string
          _scraper_id: string
          _slot_date: string
          _slot_time: string
        }
        Returns: string
      }
      log_notification: {
        Args: {
          _channel: Database["public"]["Enums"]["notification_channel"]
          _error: string
          _slot_event_id: string
          _status: string
          _user_id: string
        }
        Returns: string
      }
      match_trackers_for_slot: {
        Args: { _slot_event_id: string }
        Returns: {
          user_id: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      notification_channel:
        | "web_push"
        | "email"
        | "sms"
        | "telegram"
        | "whatsapp"
        | "in_app"
      provider_type: "vfs" | "bls" | "tls" | "visametric" | "other"
      slot_source: "scraper" | "user_report"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
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
      notification_channel: [
        "web_push",
        "email",
        "sms",
        "telegram",
        "whatsapp",
        "in_app",
      ],
      provider_type: ["vfs", "bls", "tls", "visametric", "other"],
      slot_source: ["scraper", "user_report"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
    },
  },
} as const
