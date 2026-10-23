/**
 * Hand-written database types for the starter schema.
 *
 * In a real project, generate these with the Supabase CLI instead:
 *
 *   supabase gen types typescript --local > src/lib/supabase/database.types.ts
 *
 * and import that file. The shape below mirrors
 * `supabase/migrations/00001_init.sql` exactly.
 *
 * Cortex tables (teams, conversations, knowledge_bases, etc.) are defined
 * with generic Record types until `supabase gen types` is run against a live
 * project with the migrations applied. This unblocks the build; the RLS
 * policies and SQL are the source of truth for the schema.
 */

type GenericCortexTable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Row: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Insert: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Update: Record<string, any>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          /** Nullable pointer at the caller's current team. Multi-tenant clones point this at their own teams table. */
          active_team_id: string | null;
          default_model_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          active_team_id?: string | null;
          default_model_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          active_team_id?: string | null;
          default_model_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // Cortex core (migrations 00002-00005). Generic until `supabase gen types`.
      teams: GenericCortexTable;
      team_members: GenericCortexTable;
      team_invites: GenericCortexTable;
      conversations: GenericCortexTable;
      messages: GenericCortexTable;
      message_search: GenericCortexTable;
      prompt_templates: GenericCortexTable;
      prompt_template_versions: GenericCortexTable;
      usage_events: GenericCortexTable;
      usage_daily: GenericCortexTable;
      api_keys: GenericCortexTable;
      audit_log: GenericCortexTable;
      model_catalog: GenericCortexTable;
      // Cortex RAG (migrations 00003-00005).
      knowledge_bases: GenericCortexTable;
      documents: GenericCortexTable;
      document_chunks: GenericCortexTable;
      embeddings: GenericCortexTable;
      retrieval_events: GenericCortexTable;
      eval_cases: GenericCortexTable;
      eval_runs: GenericCortexTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
