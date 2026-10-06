-- =============================================================================
-- 00004_indexes_cleanup.sql — HNSW index + starter cleanup
--
--   * Builds the pgvector HNSW index for dense retrieval (empty at migration
--     time, so the build is instant; production bulk ingests use the same
--     index — see docs/runbooks/embedding-model-migration.md).
--   * Drops the starter's redundant profiles updated_at trigger (00002
--     installs its own `trg_set_updated_at`).
-- =============================================================================

create index if not exists embeddings_hnsw_idx
  on public.embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

drop trigger if exists profiles_set_updated_at on public.profiles;
