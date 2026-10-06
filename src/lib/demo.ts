/**
 * Demo mode — a fully local, credential-free runtime for the Cortex app.
 *
 * When `DEMO_MODE=true` (documented in `.env.example`, never enabled in
 * production), the app serves a fixed demo user ("Amara Diallo") and an
 * in-memory data store instead of Supabase. The same business logic runs
 * (mock LLM provider, mock embeddings, real chunking / PII redaction /
 * injection scanning / RRF retrieval), only the persistence layer differs.
 *
 * This is what powers `pnpm test:e2e` and the one-command live demo:
 * no Supabase project, no API keys, everything clickable.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/** Client-visible flag (NEXT_PUBLIC_) for demo-only UI affordances. */
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
