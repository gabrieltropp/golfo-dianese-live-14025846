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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allerta_override: {
        Row: {
          attivo: boolean
          colore: string
          descrizione: string | null
          giorno: string
          idraulico: string | null
          idrogeologico: string | null
          temporali: string | null
          updated_at: string
        }
        Insert: {
          attivo?: boolean
          colore?: string
          descrizione?: string | null
          giorno: string
          idraulico?: string | null
          idrogeologico?: string | null
          temporali?: string | null
          updated_at?: string
        }
        Update: {
          attivo?: boolean
          colore?: string
          descrizione?: string | null
          giorno?: string
          idraulico?: string | null
          idrogeologico?: string | null
          temporali?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          creato_il: string
          evento: string
          id: number
        }
        Insert: {
          creato_il?: string
          evento: string
          id?: never
        }
        Update: {
          creato_il?: string
          evento?: string
          id?: never
        }
        Relationships: []
      }
      avvisi: {
        Row: {
          categoria: string | null
          comune: string
          comuni_citati: string[]
          created_at: string
          data_intervento: string | null
          data_pubblicazione: string | null
          fetched_at: string
          fonte: string
          id: string
          necessita_revisione: boolean
          testo_breve: string | null
          titolo: string
          updated_at: string
          url: string
        }
        Insert: {
          categoria?: string | null
          comune: string
          comuni_citati?: string[]
          created_at?: string
          data_intervento?: string | null
          data_pubblicazione?: string | null
          fetched_at?: string
          fonte: string
          id?: string
          necessita_revisione?: boolean
          testo_breve?: string | null
          titolo: string
          updated_at?: string
          url: string
        }
        Update: {
          categoria?: string | null
          comune?: string
          comuni_citati?: string[]
          created_at?: string
          data_intervento?: string | null
          data_pubblicazione?: string | null
          fetched_at?: string
          fonte?: string
          id?: string
          necessita_revisione?: boolean
          testo_breve?: string | null
          titolo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      balneazione_stato: {
        Row: {
          anno: number | null
          classificazione: string | null
          codice_acqua: string
          created_at: string
          data_ultimo_controllo: string | null
          fetched_at: string
          motivo: string | null
          source_url: string | null
          stato: string
          stato_raw: string | null
          updated_at: string
        }
        Insert: {
          anno?: number | null
          classificazione?: string | null
          codice_acqua: string
          created_at?: string
          data_ultimo_controllo?: string | null
          fetched_at?: string
          motivo?: string | null
          source_url?: string | null
          stato?: string
          stato_raw?: string | null
          updated_at?: string
        }
        Update: {
          anno?: number | null
          classificazione?: string | null
          codice_acqua?: string
          created_at?: string
          data_ultimo_controllo?: string | null
          fetched_at?: string
          motivo?: string | null
          source_url?: string | null
          stato?: string
          stato_raw?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balneazione_stato_codice_acqua_fkey"
            columns: ["codice_acqua"]
            isOneToOne: true
            referencedRelation: "punti_balneazione"
            referencedColumns: ["codice_acqua"]
          },
        ]
      }
      bathing_water: {
        Row: {
          beach_name: string
          comune: string
          created_at: string
          id: string
          last_sampled_on: string | null
          notes: string | null
          source_url: string | null
          status: string
          updated_at: string
          water_code: string
        }
        Insert: {
          beach_name: string
          comune?: string
          created_at?: string
          id?: string
          last_sampled_on?: string | null
          notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          water_code: string
        }
        Update: {
          beach_name?: string
          comune?: string
          created_at?: string
          id?: string
          last_sampled_on?: string | null
          notes?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          water_code?: string
        }
        Relationships: []
      }
      bike_path_status: {
        Row: {
          created_at: string
          id: string
          message_en: string | null
          message_it: string | null
          segment: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_en?: string | null
          message_it?: string | null
          segment?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_en?: string | null
          message_it?: string | null
          segment?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fonti_stato: {
        Row: {
          anomalia: string | null
          created_at: string
          error: string | null
          fail_streak: number
          fetched_at: string
          fonte: string
          items: number
          last_success_at: string | null
          ok: boolean
          updated_at: string
        }
        Insert: {
          anomalia?: string | null
          created_at?: string
          error?: string | null
          fail_streak?: number
          fetched_at?: string
          fonte: string
          items?: number
          last_success_at?: string | null
          ok?: boolean
          updated_at?: string
        }
        Update: {
          anomalia?: string | null
          created_at?: string
          error?: string | null
          fail_streak?: number
          fetched_at?: string
          fonte?: string
          items?: number
          last_success_at?: string | null
          ok?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      punti_balneazione: {
        Row: {
          codice_acqua: string
          comune: string
          created_at: string
          nome_punto: string
          ordine_costa: number
          updated_at: string
        }
        Insert: {
          codice_acqua: string
          comune: string
          created_at?: string
          nome_punto: string
          ordine_costa?: number
          updated_at?: string
        }
        Update: {
          codice_acqua?: string
          comune?: string
          created_at?: string
          nome_punto?: string
          ordine_costa?: number
          updated_at?: string
        }
        Relationships: []
      }
      segnalazioni: {
        Row: {
          categoria: string | null
          comune: string
          contatto: string | null
          created_at: string
          data_invio: string
          data_verifica: string | null
          fonte_verifica_url: string | null
          foto_url: string | null
          id: string
          ip_hash: string | null
          note_moderazione: string | null
          stato: string
          testo: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          comune: string
          contatto?: string | null
          created_at?: string
          data_invio?: string
          data_verifica?: string | null
          fonte_verifica_url?: string | null
          foto_url?: string | null
          id?: string
          ip_hash?: string | null
          note_moderazione?: string | null
          stato?: string
          testo: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          comune?: string
          contatto?: string | null
          created_at?: string
          data_invio?: string
          data_verifica?: string | null
          fonte_verifica_url?: string | null
          foto_url?: string | null
          id?: string
          ip_hash?: string | null
          note_moderazione?: string | null
          stato?: string
          testo?: string
          updated_at?: string
        }
        Relationships: []
      }
      traduzioni: {
        Row: {
          campo: string
          contenuto_id: string
          created_at: string
          hash_sorgente: string
          lingua: string
          testo_tradotto: string
          updated_at: string
        }
        Insert: {
          campo: string
          contenuto_id: string
          created_at?: string
          hash_sorgente: string
          lingua: string
          testo_tradotto: string
          updated_at?: string
        }
        Update: {
          campo?: string
          contenuto_id?: string
          created_at?: string
          hash_sorgente?: string
          lingua?: string
          testo_tradotto?: string
          updated_at?: string
        }
        Relationships: []
      }
      tratti_ciclabile: {
        Row: {
          a: string
          da: string
          id: number
          nota: string | null
          ordine: number
          stato: string
          updated_at: string
        }
        Insert: {
          a: string
          da: string
          id: number
          nota?: string | null
          ordine: number
          stato?: string
          updated_at?: string
        }
        Update: {
          a?: string
          da?: string
          id?: number
          nota?: string | null
          ordine?: number
          stato?: string
          updated_at?: string
        }
        Relationships: []
      }
      water_advisories: {
        Row: {
          comune: string
          created_at: string
          description: string | null
          expected_restore_at: string | null
          id: string
          is_active: boolean
          kind: string
          published_at: string
          source: string
          source_url: string | null
          updated_at: string
          zone: string
        }
        Insert: {
          comune?: string
          created_at?: string
          description?: string | null
          expected_restore_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          published_at?: string
          source?: string
          source_url?: string | null
          updated_at?: string
          zone: string
        }
        Update: {
          comune?: string
          created_at?: string
          description?: string | null
          expected_restore_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          published_at?: string
          source?: string
          source_url?: string | null
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      segnalazioni_pubbliche: {
        Row: {
          categoria: string | null
          comune: string | null
          data_invio: string | null
          data_verifica: string | null
          fonte_verifica_url: string | null
          foto_url: string | null
          id: string | null
          stato: string | null
          testo: string | null
        }
        Insert: {
          categoria?: string | null
          comune?: string | null
          data_invio?: string | null
          data_verifica?: string | null
          fonte_verifica_url?: string | null
          foto_url?: string | null
          id?: string | null
          stato?: string | null
          testo?: string | null
        }
        Update: {
          categoria?: string | null
          comune?: string | null
          data_invio?: string | null
          data_verifica?: string | null
          fonte_verifica_url?: string | null
          foto_url?: string | null
          id?: string | null
          stato?: string | null
          testo?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      refresh_avvisi: { Args: never; Returns: Json }
      refresh_balneazione: { Args: never; Returns: Json }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
    Enums: {},
  },
} as const
