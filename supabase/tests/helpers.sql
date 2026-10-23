-- =============================================================================
-- helpers.sql — shared fixtures for the pgTAP-style RLS test suite.
--
-- Run after `supabase db reset` (migrations 00001-00004 applied):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/helpers.sql \
--     -f supabase/tests/rls_core.sql \
--     -f supabase/tests/rls_rag.sql
--
-- The suite is written in pgTAP *style* (one assertion per block, descriptive
-- failure messages) but needs no extension: every block is a plain DO block
-- that raises on failure. In CI these run against a throwaway Supabase
-- project once one exists (see .github/workflows/ci.yml `db-tests` job).
-- =============================================================================

create schema if not exists tests;

-- Switch the simulated auth context: RLS policies read auth.uid(), which is
-- derived from the request.jwt.claims setting.
create or replace function tests.set_user(p_user_id uuid)
returns void
language sql
as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text,
    true
  );
$$;

create or replace function tests.clear_user()
returns void
language sql
as $$
  select set_config('request.jwt.claims', '', true);
$$;

-- Assertion helpers -----------------------------------------------------------
create or replace function tests.assert_eq(p_label text, p_actual anyelement, p_expected anyelement)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_label, p_expected, p_actual;
  end if;
  raise notice 'ok %', p_label;
end;
$$;

create or replace function tests.assert_true(p_label text, p_value boolean)
returns void
language plpgsql
as $$
begin
  if coalesce(p_value, false) <> true then
    raise exception 'FAIL %: expected true', p_label;
  end if;
  raise notice 'ok %', p_label;
end;
$$;

-- Run a statement as the service_role (bypasses RLS) and return to the
-- previous local role afterwards.
create or replace function tests.as_service(p_sql text)
returns void
language plpgsql
as $$
begin
  -- The caller is expected to already hold adequate privileges (the suite
  -- runs as the postgres superuser against a throwaway database).
  execute p_sql;
end;
$$;

-- Fixtures --------------------------------------------------------------------
-- Two users, two teams. user_a owns team_a; user_b is a member of team_a and
-- owns team_b. All UUIDs are fixed so assertions are deterministic.

do $$
declare
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_team_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_team_b uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
begin
  -- auth.users rows (minimal; the handle_new_user trigger is bypassed by
  -- inserting profiles directly for determinism).
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (v_user_a, 'a@example.com', 'x', now(), now(), now()),
    (v_user_b, 'b@example.com', 'x', now(), now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name)
  values (v_user_a, 'User A'), (v_user_b, 'User B')
  on conflict (id) do update set display_name = excluded.display_name;

  -- seat_count is billing-guarded (only service_role may change it).
  set role service_role;
  insert into public.teams (id, name, slug, seat_count)
  values
    (v_team_a, 'Team A', 'team-a-tests', 5),
    (v_team_b, 'Team B', 'team-b-tests', 5)
  on conflict (id) do update set seat_count = excluded.seat_count;
  reset role;

  insert into public.team_members (team_id, user_id, role, status)
  values
    (v_team_a, v_user_a, 'owner',  'active'),
    (v_team_a, v_user_b, 'member', 'active'),
    (v_team_b, v_user_b, 'owner',  'active')
  on conflict (team_id, user_id) do update
    set role = excluded.role, status = excluded.status;

  -- A conversation + message owned by user_b in team_a.
  insert into public.conversations (id, team_id, user_id, title, model_id)
  values ('c0000000-0000-0000-0000-000000000001', v_team_a, v_user_b, 'B convo', 'cortex-flash')
  on conflict (id) do nothing;

  insert into public.messages (id, conversation_id, role, content)
  values ('d0000000-0000-0000-0000-000000000001',
          'c0000000-0000-0000-0000-000000000001', 'user', 'hello from b')
  on conflict (id) do nothing;

  -- A personal template by user_b (invisible to user_a) and a team template.
  insert into public.prompt_templates (id, team_id, author_id, name, prompt_body, visibility)
  values
    ('e0000000-0000-0000-0000-000000000001', v_team_a, v_user_b, 'B personal', 'do {{thing}}', 'personal'),
    ('e0000000-0000-0000-0000-000000000002', v_team_a, v_user_b, 'B team tpl', 'team {{thing}}', 'team')
  on conflict (id) do nothing;

  raise notice 'fixtures ready';
end;
$$;
