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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      launch_events: {
        Row: {
          created_at: string
          id: string
          launch_id: string | null
          message: string | null
          metadata: Json | null
          status: string
          step: string
        }
        Insert: {
          created_at?: string
          id?: string
          launch_id?: string | null
          message?: string | null
          metadata?: Json | null
          status: string
          step: string
        }
        Update: {
          created_at?: string
          id?: string
          launch_id?: string | null
          message?: string | null
          metadata?: Json | null
          status?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_events_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_events_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches_public"
            referencedColumns: ["id"]
          },
        ]
      }
      launches: {
        Row: {
          agent_name: string
          allow_token_mention: boolean | null
          created_at: string
          creator_wallet: string
          id: string
          image_url: string | null
          mint: string | null
          moltbook_api_key: string | null
          moltbook_bio: string | null
          moltbook_claim_url: string | null
          moltbook_verification_code: string | null
          moltbook_verified: boolean | null
          personality: string
          posting_frequency: string | null
          pump_url: string | null
          status: string
          target_community: string | null
          telegram_url: string | null
          token_name: string
          token_symbol: string
          tx_signature: string | null
          updated_at: string
          website_url: string | null
          x_url: string | null
        }
        Insert: {
          agent_name: string
          allow_token_mention?: boolean | null
          created_at?: string
          creator_wallet: string
          id?: string
          image_url?: string | null
          mint?: string | null
          moltbook_api_key?: string | null
          moltbook_bio?: string | null
          moltbook_claim_url?: string | null
          moltbook_verification_code?: string | null
          moltbook_verified?: boolean | null
          personality: string
          posting_frequency?: string | null
          pump_url?: string | null
          status?: string
          target_community?: string | null
          telegram_url?: string | null
          token_name: string
          token_symbol: string
          tx_signature?: string | null
          updated_at?: string
          website_url?: string | null
          x_url?: string | null
        }
        Update: {
          agent_name?: string
          allow_token_mention?: boolean | null
          created_at?: string
          creator_wallet?: string
          id?: string
          image_url?: string | null
          mint?: string | null
          moltbook_api_key?: string | null
          moltbook_bio?: string | null
          moltbook_claim_url?: string | null
          moltbook_verification_code?: string | null
          moltbook_verified?: boolean | null
          personality?: string
          posting_frequency?: string | null
          pump_url?: string | null
          status?: string
          target_community?: string | null
          telegram_url?: string | null
          token_name?: string
          token_symbol?: string
          tx_signature?: string | null
          updated_at?: string
          website_url?: string | null
          x_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      launches_public: {
        Row: {
          agent_name: string | null
          allow_token_mention: boolean | null
          created_at: string | null
          creator_wallet: string | null
          id: string | null
          image_url: string | null
          mint: string | null
          moltbook_bio: string | null
          moltbook_verified: boolean | null
          personality: string | null
          posting_frequency: string | null
          pump_url: string | null
          status: string | null
          target_community: string | null
          telegram_url: string | null
          token_name: string | null
          token_symbol: string | null
          tx_signature: string | null
          updated_at: string | null
          website_url: string | null
          x_url: string | null
        }
        Insert: {
          agent_name?: string | null
          allow_token_mention?: boolean | null
          created_at?: string | null
          creator_wallet?: string | null
          id?: string | null
          image_url?: string | null
          mint?: string | null
          moltbook_bio?: string | null
          moltbook_verified?: boolean | null
          personality?: string | null
          posting_frequency?: string | null
          pump_url?: string | null
          status?: string | null
          target_community?: string | null
          telegram_url?: string | null
          token_name?: string | null
          token_symbol?: string | null
          tx_signature?: string | null
          updated_at?: string | null
          website_url?: string | null
          x_url?: string | null
        }
        Update: {
          agent_name?: string | null
          allow_token_mention?: boolean | null
          created_at?: string | null
          creator_wallet?: string | null
          id?: string | null
          image_url?: string | null
          mint?: string | null
          moltbook_bio?: string | null
          moltbook_verified?: boolean | null
          personality?: string | null
          posting_frequency?: string | null
          pump_url?: string | null
          status?: string | null
          target_community?: string | null
          telegram_url?: string | null
          token_name?: string | null
          token_symbol?: string | null
          tx_signature?: string | null
          updated_at?: string | null
          website_url?: string | null
          x_url?: string | null
        }
        Relationships: []
      }
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
