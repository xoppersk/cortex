-- =============================================================================
-- rls_rag.sql — RLS assertions for the RAG schema (Phase 10).
-- Requires helpers.sql fixtures. Run as a superuser against a throwaway DB,
-- after rls_core.sql (which leaves the session role as authenticated).
-- =============================================================================

set role authenticated;

-- Fixtures: one KB + document + chunk + embedding in team_a; one KB in team_b.
do $$
declare
  v_kb_a uuid := 'f0000000-0000-0000-0000-00000000000a';
  v_kb_b uuid := 'f0000000-0000-0000-0000-00000000000b';
  v_doc_a uuid := 'f0000000-0000-0000-0000-0000000000d0';
  v_chunk_a uuid := 'f0000000-0000-0000-0000-0000000000c0';
begin
  reset role;
  insert into public.knowledge_bases (id, team_id, name, created_by)
  values
    (v_kb_a, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KB A',
     '11111111-1111-1111-1111-111111111111'),
    (v_kb_b, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'KB B',
     '22222222-2222-2222-2222-222222222222')
  on conflict (id) do nothing;

  insert into public.documents (id, kb_id, team_id, name, status, uploaded_by)
  values (v_doc_a, v_kb_a, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'doc-a.md', 'ready', '11111111-1111-1111-1111-111111111111')
  on conflict (id) do nothing;

  insert into public.document_chunks
    (id, document_id, kb_id, team_id, chunk_index, content, token_count, search_vector)
  values (v_chunk_a, v_doc_a, v_kb_a, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          0, 'cortex pricing is per seat', 8, to_tsvector('english', 'cortex pricing is per seat'))
  on conflict (document_id, chunk_index) do nothing;

  insert into public.embeddings (chunk_id, kb_id, team_id, embedding)
  values (v_chunk_a, v_kb_a, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          array_fill(0.1, array[1536])::vector)
  on conflict (chunk_id) do nothing;

  -- A retrieval event tied to user_b's conversation in team_a.
  insert into public.retrieval_events
    (team_id, kb_id, conversation_id, query_text, top_k, rerank_top_n)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_kb_a,
          'c0000000-0000-0000-0000-000000000001', 'what is pricing?', 8, 4);

  -- Two eval cases + one eval run in KB A.
  insert into public.eval_cases (kb_id, question, expected_answer, difficulty)
  values (v_kb_a, 'What is pricing?', 'Per-seat pricing.', 'factoid'),
         (v_kb_a, 'Is there a free lunch?', 'Unknown.', 'unanswerable');

  insert into public.eval_runs (kb_id, triggered_by, status, groundedness_avg, precision_at_4)
  values (v_kb_a, 'ci', 'passed', 0.95, 0.85);

  set role authenticated;
  raise notice 'rag fixtures ready';
end $$;

-- ------------------------------------------------- KB / documents / chunks --
do $$
declare v_n int;
begin
  -- user_b (member of team_a) reads KB A artifacts but not KB B.
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.knowledge_bases
  where id = 'f0000000-0000-0000-0000-00000000000a';
  perform tests.assert_eq('kb: member reads own-team KB', v_n, 1);
  select count(*) into v_n from public.knowledge_bases
  where id = 'f0000000-0000-0000-0000-00000000000b';
  perform tests.assert_eq('kb: cross-team KB hidden from non-member', v_n, 0);

  select count(*) into v_n from public.documents
  where id = 'f0000000-0000-0000-0000-0000000000d0';
  perform tests.assert_eq('documents: member reads own-team doc', v_n, 1);

  select count(*) into v_n from public.document_chunks
  where id = 'f0000000-0000-0000-0000-0000000000c0';
  perform tests.assert_eq('chunks: member reads own-team chunk (sources panel)', v_n, 1);

  select count(*) into v_n from public.embeddings;
  perform tests.assert_eq('embeddings: member reads own-team embeddings', v_n, 1);

  -- Members may create KBs; only admins may retune them.
  insert into public.knowledge_bases (team_id, name, created_by)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Member KB',
          '22222222-2222-2222-2222-222222222222');
  perform tests.assert_true('kb: member can create', found);

  begin
    update public.knowledge_bases set retrieval_top_k = 16
    where id = 'f0000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL kb: member retune should have been denied';
  exception when insufficient_privilege then
    raise notice 'ok kb: member cannot retune retrieval settings';
  end;

  -- No client writes to chunks/embeddings (ingest is service_role only).
  begin
    insert into public.document_chunks
      (document_id, kb_id, team_id, chunk_index, content, token_count, search_vector)
    values ('f0000000-0000-0000-0000-0000000000d0',
            'f0000000-0000-0000-0000-00000000000a',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'x', 1,
            to_tsvector('english', 'x'));
    raise exception 'FAIL chunks: client insert should have been denied';
  exception when insufficient_privilege then
    raise notice 'ok chunks: client insert denied (ingest is service_role)';
  end;
end $$;

-- ---------------------------------------------------------- retrieval_events --
do $$
declare v_n int;
begin
  -- user_b sees the event tied to their own conversation.
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.retrieval_events
  where query_text = 'what is pricing?';
  perform tests.assert_true('retrieval_events: member sees own', v_n >= 1);

  -- A different conversation's event (owned by user_a) is hidden from user_b.
  reset role;
  insert into public.conversations (id, team_id, user_id, title, model_id)
  values ('c0000000-0000-0000-0000-000000000004',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '11111111-1111-1111-1111-111111111111', 'A rag convo', 'cortex-flash')
  on conflict (id) do nothing;
  insert into public.retrieval_events
    (team_id, kb_id, conversation_id, query_text, top_k, rerank_top_n)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'f0000000-0000-0000-0000-00000000000a',
          'c0000000-0000-0000-0000-000000000004', 'a private query', 8, 4);
  set role authenticated;

  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.retrieval_events
  where query_text = 'a private query';
  perform tests.assert_eq('retrieval_events: peer rows hidden from member', v_n, 0);

  -- user_a (admin) sees all team events.
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.retrieval_events
  where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform tests.assert_true('retrieval_events: admin sees team rows', v_n >= 2);
end $$;

-- ------------------------------------------------- eval_cases / eval_runs --
do $$
declare v_n int;
begin
  -- Members can read the eval set and run history (transparency).
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.eval_cases
  where kb_id = 'f0000000-0000-0000-0000-00000000000a';
  perform tests.assert_eq('eval_cases: member reads seeded set', v_n, 2);
  select count(*) into v_n from public.eval_runs
  where kb_id = 'f0000000-0000-0000-0000-00000000000a';
  perform tests.assert_true('eval_runs: member reads run history', v_n >= 1);

  -- Members cannot curate the eval set; admins can.
  begin
    insert into public.eval_cases (kb_id, question, expected_answer)
    values ('f0000000-0000-0000-0000-00000000000a', 'q?', 'a.');
    raise exception 'FAIL eval_cases: member insert should have been denied';
  exception when insufficient_privilege then
    raise notice 'ok eval_cases: member insert denied (admin curation)';
  end;

  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  insert into public.eval_cases (kb_id, question, expected_answer)
  values ('f0000000-0000-0000-0000-00000000000a', 'admin q?', 'admin a.');
  perform tests.assert_true('eval_cases: admin can curate', found);
end $$;

reset role;
