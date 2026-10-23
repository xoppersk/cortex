-- =============================================================================
-- 00003_cortex_rag.sql — Cortex RAG schema (Phase 10)
--
--   knowledge_bases → documents → document_chunks → embeddings (pgvector),
--   plus retrieval_events (append-only), eval_cases, and eval_runs.
--   Requires the pgvector extension.
-- =============================================================================

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- knowledge_bases
-- ---------------------------------------------------------------------------
create table public.knowledge_bases (
  id                   uuid primary key default gen_random_uuid(),
  team_id              uuid not null references public.teams (id) on delete cascade,
  name                 text not null check (char_length(name) between 2 and 80),
  description          text not null default '',
  embedding_model      text not null default 'text-embedding-3-small',
  chunk_size_tokens    int not null default 800 check (chunk_size_tokens between 200 and 2000),
  chunk_overlap_pct    int not null default 15 check (chunk_overlap_pct between 0 and 40),
  retrieval_top_k      int not null default 8,
  rerank_top_n         int not null default 4,
  similarity_threshold numeric(4,3) not null default 0.250,
  created_by           uuid not null references public.profiles (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);
create index knowledge_bases_team_idx on public.knowledge_bases (team_id, deleted_at);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  kb_id          uuid not null references public.knowledge_bases (id) on delete cascade,
  team_id        uuid not null references public.teams (id) on delete cascade, -- denormalized for RLS
  name           text not null,
  source_type    text not null default 'upload' check (source_type in ('upload','url','api')),
  storage_path   text,
  mime_type      text,
  size_bytes     bigint,
  status         text not null default 'queued'
                 check (status in ('queued','processing','ready','failed','quarantined')),
  status_error   text,
  chunk_count    int not null default 0,
  injection_flags int not null default 0,
  uploaded_by    uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index documents_kb_status_idx on public.documents (kb_id, status);
create index documents_team_idx on public.documents (team_id, created_at desc);

-- ---------------------------------------------------------------------------
-- document_chunks
-- ---------------------------------------------------------------------------
create table public.document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents (id) on delete cascade,
  kb_id         uuid not null references public.knowledge_bases (id) on delete cascade, -- denormalized
  team_id       uuid not null, -- denormalized for RLS
  chunk_index   int not null,
  content       text not null, -- PII-redacted at ingest
  token_count   int not null,
  metadata      jsonb not null default '{}', -- {page, section_heading}
  search_vector tsvector not null, -- sparse leg of hybrid retrieval
  created_at    timestamptz not null default now(),
  unique (document_id, chunk_index)
);
create index document_chunks_doc_idx on public.document_chunks (document_id, chunk_index);
create index document_chunks_search_gin on public.document_chunks using gin (search_vector);
create index document_chunks_kb_idx on public.document_chunks (kb_id);

-- ---------------------------------------------------------------------------
-- embeddings (dense vectors; cosine distance)
-- ---------------------------------------------------------------------------
create table public.embeddings (
  id        uuid primary key default gen_random_uuid(),
  chunk_id  uuid unique not null references public.document_chunks (id) on delete cascade,
  kb_id     uuid not null, -- denormalized for RLS
  team_id   uuid not null, -- denormalized for RLS
  embedding vector(1536) not null, -- OpenAI text-embedding-3-small
  model     text not null default 'text-embedding-3-small',
  created_at timestamptz not null default now()
);
-- NOTE: the HNSW index is built AFTER the seeded bulk ingest (an index built
-- on an empty table and then loaded is the fastest path). The seed/ingest
-- runbook runs:  CREATE INDEX CONCURRENTLY ... USING hnsw ...
create index embeddings_kb_idx on public.embeddings (kb_id);
create index embeddings_chunk_idx on public.embeddings (chunk_id);

-- ---------------------------------------------------------------------------
-- retrieval_events (append-only)
-- ---------------------------------------------------------------------------
create table public.retrieval_events (
  id                   bigint primary key generated always as identity,
  team_id              uuid not null,
  kb_id                uuid not null references public.knowledge_bases (id) on delete cascade,
  conversation_id      uuid references public.conversations (id) on delete set null,
  message_id           uuid references public.messages (id) on delete set null,
  query_text           text not null,
  top_k                int not null,
  rerank_top_n         int not null,
  retrieved_chunk_ids  uuid[] not null default '{}', -- fused top-k, pre-rerank
  cited_chunk_ids      uuid[] not null default '{}', -- post-rerank, sent to the LLM
  scores               jsonb not null default '{}',  -- {chunk_id: {dense, sparse, fused, rerank}}
  refused_no_context   boolean not null default false,
  retrieval_latency_ms int,
  embedding_tokens     int,
  pii_spans_redacted   int not null default 0, -- count only, never the values
  created_at           timestamptz not null default now()
);
create index retrieval_events_kb_idx on public.retrieval_events (kb_id, created_at desc);
create index retrieval_events_team_idx on public.retrieval_events (team_id, created_at desc);

-- ---------------------------------------------------------------------------
-- eval_cases (seeded Q/A pairs)
-- ---------------------------------------------------------------------------
create table public.eval_cases (
  id                 uuid primary key default gen_random_uuid(),
  kb_id              uuid not null references public.knowledge_bases (id) on delete cascade,
  question           text not null,
  expected_answer    text not null, -- reference; the judge compares against retrieved evidence
  expected_chunk_ids uuid[] not null default '{}',
  difficulty         text not null default 'factoid'
                     check (difficulty in ('factoid','multi-hop','adversarial','unanswerable')),
  tags               text[] not null default '{}',
  created_by         uuid references public.profiles (id) on delete set null, -- null = seeded by repo
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- eval_runs (append-only; the CI gate reads the latest main run)
-- ---------------------------------------------------------------------------
create table public.eval_runs (
  id                 uuid primary key default gen_random_uuid(),
  kb_id              uuid not null references public.knowledge_bases (id) on delete cascade,
  triggered_by       text not null check (triggered_by in ('ci','nightly','manual')),
  git_sha            text,
  status             text not null default 'running' check (status in ('running','passed','failed')),
  groundedness_avg   numeric(5,4), -- 0-1 headline metric
  precision_at_4     numeric(5,4), -- 0-1
  answer_relevance_avg numeric(5,4),
  latency_p95_ms     int,
  cases_total        int not null default 0,
  cases_passed       int not null default 0,
  details            jsonb not null default '[]',
  created_at         timestamptz not null default now()
);
create index eval_runs_kb_idx on public.eval_runs (kb_id, created_at desc);

-- ===========================================================================
-- Triggers
-- ===========================================================================
-- document_chunks.search_vector maintenance (sparse retrieval leg)
create or replace function public.maintain_chunk_search_vector()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.content, ''));
  return new;
end;
$$;

drop trigger if exists trg_chunk_search_vector on public.document_chunks;
create trigger trg_chunk_search_vector
  before insert or update of content on public.document_chunks
  for each row execute function public.maintain_chunk_search_vector();

-- updated_at on knowledge_bases + documents
do $$
declare t text;
begin
  foreach t in array array['knowledge_bases','documents']
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;
       create trigger trg_set_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table public.knowledge_bases  enable row level security;
alter table public.documents        enable row level security;
alter table public.document_chunks  enable row level security;
alter table public.embeddings       enable row level security;
alter table public.retrieval_events enable row level security;
alter table public.eval_cases       enable row level security;
alter table public.eval_runs        enable row level security;

-- knowledge_bases
create policy knowledge_bases_select on public.knowledge_bases
  for select to authenticated
  using (deleted_at is null and public.is_team_member(team_id));

create policy knowledge_bases_insert on public.knowledge_bases
  for insert to authenticated
  with check (public.is_team_member(team_id));

create policy knowledge_bases_update on public.knowledge_bases
  for update to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- documents
create policy documents_select on public.documents
  for select to authenticated
  using (public.is_team_member(team_id));

create policy documents_insert on public.documents
  for insert to authenticated
  with check (public.is_team_member(team_id));

create policy documents_update on public.documents
  for update to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- document_chunks / embeddings — read for the Sources panel + citation links;
-- all writes via the ingest pipeline as service_role.
create policy document_chunks_select on public.document_chunks
  for select to authenticated
  using (public.is_team_member(team_id));

create policy embeddings_select on public.embeddings
  for select to authenticated
  using (public.is_team_member(team_id));

-- retrieval_events — members see their own (via conversation ownership),
-- admins see the whole team (quality report).
create policy retrieval_events_select on public.retrieval_events
  for select to authenticated
  using (
    public.is_team_admin(team_id)
    or exists (
      select 1 from public.conversations c
      where c.id = retrieval_events.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- eval_cases — visible to the whole team; curation is admin-only.
create policy eval_cases_select on public.eval_cases
  for select to authenticated
  using (
    exists (
      select 1 from public.knowledge_bases kb
      where kb.id = eval_cases.kb_id and public.is_team_member(kb.team_id)
    )
  );

create policy eval_cases_admin_write on public.eval_cases
  for all to authenticated
  using (
    exists (
      select 1 from public.knowledge_bases kb
      where kb.id = eval_cases.kb_id and public.is_team_admin(kb.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.knowledge_bases kb
      where kb.id = eval_cases.kb_id and public.is_team_admin(kb.team_id)
    )
  );

-- eval_runs — visible to the whole team; writes via the eval harness as service_role.
create policy eval_runs_select on public.eval_runs
  for select to authenticated
  using (
    exists (
      select 1 from public.knowledge_bases kb
      where kb.id = eval_runs.kb_id and public.is_team_member(kb.team_id)
    )
  );
