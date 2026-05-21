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
      admin_check_logs: {
        Row: {
          context: string | null
          created_at: string
          email: string | null
          id: string
          is_admin: boolean
          roles_found: string[] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_admin: boolean
          roles_found?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          roles_found?: string[] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          age: number | null
          created_at: string
          discord: string | null
          experience: string | null
          extra: Json
          id: string
          mc_username: string
          portfolio_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          timezone: string | null
          type: Database["public"]["Enums"]["application_type"]
          updated_at: string
          user_id: string
          why: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          discord?: string | null
          experience?: string | null
          extra?: Json
          id?: string
          mc_username: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          timezone?: string | null
          type: Database["public"]["Enums"]["application_type"]
          updated_at?: string
          user_id: string
          why: string
        }
        Update: {
          age?: number | null
          created_at?: string
          discord?: string | null
          experience?: string | null
          extra?: Json
          id?: string
          mc_username?: string
          portfolio_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          timezone?: string | null
          type?: Database["public"]["Enums"]["application_type"]
          updated_at?: string
          user_id?: string
          why?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          entry_date: string
          id: string
          published: boolean
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          published?: boolean
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      discord_bot_action_logs: {
        Row: {
          action: string
          channel_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          http_status: number | null
          id: string
          message_id: string | null
          request: Json
          response: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          channel_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          message_id?: string | null
          request?: Json
          response?: Json | null
          status: string
          user_id?: string | null
        }
        Update: {
          action?: string
          channel_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          http_status?: number | null
          id?: string
          message_id?: string | null
          request?: Json
          response?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          created_at: string
          description: string
          highlights: string[]
          icon: string
          id: string
          long_description: string
          published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          highlights?: string[]
          icon?: string
          id?: string
          long_description?: string
          published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          highlights?: string[]
          icon?: string
          id?: string
          long_description?: string
          published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string | null
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          priority: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          priority?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          priority?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plugins: {
        Row: {
          author: string | null
          category: string | null
          created_at: string
          description: string | null
          download_url: string | null
          featured: boolean
          icon_url: string | null
          id: string
          jar_filename: string | null
          jar_path: string | null
          jar_size: number | null
          long_description: string | null
          name: string
          platform: string | null
          published: boolean
          screenshots: string[]
          short_id: string
          tags: string[]
          updated_at: string
          version: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          featured?: boolean
          icon_url?: string | null
          id?: string
          jar_filename?: string | null
          jar_path?: string | null
          jar_size?: number | null
          long_description?: string | null
          name: string
          platform?: string | null
          published?: boolean
          screenshots?: string[]
          short_id?: string
          tags?: string[]
          updated_at?: string
          version?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          featured?: boolean
          icon_url?: string | null
          id?: string
          jar_filename?: string | null
          jar_path?: string | null
          jar_size?: number | null
          long_description?: string | null
          name?: string
          platform?: string | null
          published?: boolean
          screenshots?: string[]
          short_id?: string
          tags?: string[]
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          mc_username: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          mc_username?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          mc_username?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rule_sections: {
        Row: {
          created_at: string
          icon: string
          id: string
          items: string[]
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          items?: string[]
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          items?: string[]
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_status: {
        Row: {
          id: number
          motd: string | null
          online: boolean
          players_max: number
          players_online: number
          updated_at: string
        }
        Insert: {
          id?: number
          motd?: string | null
          online?: boolean
          players_max?: number
          players_online?: number
          updated_at?: string
        }
        Update: {
          id?: number
          motd?: string | null
          online?: boolean
          players_max?: number
          players_online?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: []
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
      user_streaks: {
        Row: {
          created_at: string
          last_login_date: string | null
          last_vote_date: string | null
          login_best: number
          login_streak: number
          total_logins: number
          total_votes: number
          updated_at: string
          user_id: string
          vote_best: number
          vote_streak: number
        }
        Insert: {
          created_at?: string
          last_login_date?: string | null
          last_vote_date?: string | null
          login_best?: number
          login_streak?: number
          total_logins?: number
          total_votes?: number
          updated_at?: string
          user_id: string
          vote_best?: number
          vote_streak?: number
        }
        Update: {
          created_at?: string
          last_login_date?: string | null
          last_vote_date?: string | null
          login_best?: number
          login_streak?: number
          total_logins?: number
          total_votes?: number
          updated_at?: string
          user_id?: string
          vote_best?: number
          vote_streak?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_ticket: { Args: { _ticket_id: string }; Returns: boolean }
      check_is_admin_logged: {
        Args: { _context?: string; _user_agent?: string }
        Returns: boolean
      }
      gen_plugin_short_id: { Args: never; Returns: string }
      record_login_streak: {
        Args: never
        Returns: {
          created_at: string
          last_login_date: string | null
          last_vote_date: string | null
          login_best: number
          login_streak: number
          total_logins: number
          total_votes: number
          updated_at: string
          user_id: string
          vote_best: number
          vote_streak: number
        }
        SetofOptions: {
          from: "*"
          to: "user_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_vote_streak: {
        Args: never
        Returns: {
          created_at: string
          last_login_date: string | null
          last_vote_date: string | null
          login_best: number
          login_streak: number
          total_logins: number
          total_votes: number
          updated_at: string
          user_id: string
          vote_best: number
          vote_streak: number
        }
        SetofOptions: {
          from: "*"
          to: "user_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "owner"
        | "manager"
        | "developer"
        | "sr_admin"
        | "jr_admin"
        | "sr_mod"
        | "mod"
        | "sr_helper"
        | "helper"
        | "champion"
        | "media"
        | "elite"
        | "mvp"
        | "vip"
        | "booster"
        | "default"
      application_status: "pending" | "approved" | "rejected"
      application_type: "staff" | "builder" | "youtuber"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "waiting_user" | "closed"
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
      app_role: [
        "admin",
        "user",
        "owner",
        "manager",
        "developer",
        "sr_admin",
        "jr_admin",
        "sr_mod",
        "mod",
        "sr_helper",
        "helper",
        "champion",
        "media",
        "elite",
        "mvp",
        "vip",
        "booster",
        "default",
      ],
      application_status: ["pending", "approved", "rejected"],
      application_type: ["staff", "builder", "youtuber"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: ["open", "in_progress", "waiting_user", "closed"],
    },
  },
} as const
