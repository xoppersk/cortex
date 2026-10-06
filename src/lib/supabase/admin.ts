/**
 * service_role Supabase client — server-only, never bundled to the client.
 *
 * Used for privileged writes the RLS policies deliberately deny to
 * authenticated users: message persistence (finalize_message RPC), ingest
 * pipeline writes, invite acceptance, and audit logging.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service_role is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  cached = createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** True when the server can talk to Supabase (used for graceful 503s). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
