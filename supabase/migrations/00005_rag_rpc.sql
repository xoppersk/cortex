-- =============================================================================
-- 00005_rag_rpc.sql — server-side retrieval RPCs for the hybrid RAG pipeline
--
--   rag_dense_search  — pgvector HNSW cosine search over embeddings
--   rag_sparse_search — Postgres FTS (websearch) over document_chunks
--
-- Both are SECURITY DEFINER with an explicit team-membership check so the
-- /api/rag/ask route (service_role) can call them without reimplementing
-- authorization, while direct callers still can't cross team boundaries.
-- =============================================================================

create or replace function public.rag_dense_search(
  p_kb_id uuid,
  p_query_vector text,
  p_top_k int
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  content text,
  section_heading text,
  dense_score double precision
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id
  from public.knowledge_bases
  where id = p_kb_id and deleted_at is null;

  if v_team_id is null or not public.is_team_member(v_team_id) then
    raise exception 'knowledge base not found';
  end if;

  return query
  select
    c.id,
    c.document_id,
    d.name,
    c.content,
    c.metadata ->> 'section_heading',
    (1 - (e.embedding <=> p_query_vector::vector))::double precision as dense_score
  from public.embeddings e
  join public.document_chunks c on c.id = e.chunk_id
  join public.documents d on d.id = c.document_id
  where e.kb_id = p_kb_id
  order by e.embedding <=> p_query_vector::vector
  limit p_top_k;
end;
$$;

create or replace function public.rag_sparse_search(
  p_kb_id uuid,
  p_query_text text,
  p_top_k int
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  content text,
  section_heading text,
  sparse_score real
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id
  from public.knowledge_bases
  where id = p_kb_id and deleted_at is null;

  if v_team_id is null or not public.is_team_member(v_team_id) then
    raise exception 'knowledge base not found';
  end if;

  return query
  select
    c.id,
    c.document_id,
    d.name,
    c.content,
    c.metadata ->> 'section_heading',
    ts_rank(c.search_vector, websearch_to_tsquery('english', p_query_text)) as sparse_score
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where c.kb_id = p_kb_id
    and c.search_vector @@ websearch_to_tsquery('english', p_query_text)
  order by sparse_score desc
  limit p_top_k;
end;
$$;
