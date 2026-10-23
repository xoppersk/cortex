-- =============================================================================
-- seed.sql — reference data loaded by `supabase db reset` / `supabase seed`.
-- Idempotent: safe to re-run.
--
-- Demo content (demo team, templates, knowledge base documents, eval cases)
-- is NOT seeded here because it requires real user rows. Instead:
--   * `supabase/seed/knowledge-base/*.md` — the seeded KB documents
--   * `supabase/seed/eval-cases.json`     — the 60-case eval set
--   Both are loaded by the eval harness (`pnpm eval`) and by demo mode.
-- =============================================================================

insert into public.model_catalog
  (model_id, display_name, provider, provider_model,
   input_price_per_1k, output_price_per_1k,
   context_window, max_output_tokens, enabled, sort_order)
values
  ('cortex-flash',
   'Cortex Flash — fast & cheap', 'openai', 'gpt-4o-mini',
   0.000150, 0.000600, 128000, 16384, true, 10),
  ('cortex-pro',
   'Cortex Pro — balanced reasoning', 'openai', 'gpt-4o',
   0.002500, 0.010000, 128000, 16384, true, 20),
  ('cortex-reason',
   'Cortex Reason — deep thinking', 'anthropic', 'claude-opus-4-6',
   0.005000, 0.025000, 200000, 32768, true, 30)
on conflict (model_id) do update set
  display_name        = excluded.display_name,
  provider            = excluded.provider,
  provider_model      = excluded.provider_model,
  input_price_per_1k  = excluded.input_price_per_1k,
  output_price_per_1k = excluded.output_price_per_1k,
  context_window      = excluded.context_window,
  max_output_tokens   = excluded.max_output_tokens,
  enabled             = excluded.enabled,
  sort_order          = excluded.sort_order;
