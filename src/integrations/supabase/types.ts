export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      commands_history: {
        Row: {
          command: string
          executed_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          command: string
          executed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          command?: string
          executed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_groups: {
        Row: {
          created_at: string | null
          device_ids: string[]
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          device_ids?: string[]
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          device_ids?: string[]
          id?: string
          name?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          connection_status: string | null
          created_at: string | null
          firmware_version: string | null
          id: string
          ip_address: string | null
          mac_address: string | null
          manufacturer: string | null
          model: string | null
          name: string
          room: string
          state: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          room: string
          state?: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          firmware_version?: string | null
          id?: string
          ip_address?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          room?: string
          state?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          created_at: string | null
          device_states: Json
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          device_states?: Json
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          device_states?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      users_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
