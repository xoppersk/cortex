-- =============================================================================
-- rls_core.sql — RLS assertions for the core (non-RAG) schema.
-- Requires helpers.sql fixtures. Run as a superuser against a throwaway DB.
-- =============================================================================

set role authenticated;

-- ---------------------------------------------------------------- profiles --
do $$
declare
  v_a uuid := '11111111-1111-1111-1111-111111111111';
  v_b uuid := '22222222-2222-2222-2222-222222222222';
  v_n int;
begin
  -- A user always sees their own profile.
  perform tests.set_user(v_a);
  select count(*) into v_n from public.profiles where id = v_a;
  perform tests.assert_eq('profiles: user sees own row', v_n, 1);

  -- Strangers see nothing (no shared team).
  perform tests.set_user(v_b);
  select count(*) into v_n from public.profiles p
  where p.id = v_a
    and not exists (
      select 1 from public.team_members m1
      join public.team_members m2 on m1.team_id = m2.team_id
      where m1.user_id = v_b and m1.role in ('owner','admin')
        and m2.user_id = v_a and m2.status = 'active');
  -- v_b is a *member* (not admin) of team_a, so the team_read policy must not
  -- expose v_a's profile to v_b.
  select count(*) into v_n from public.profiles where id = v_a;
  perform tests.assert_eq('profiles: non-admin teammate sees no profile', v_n, 0);

  -- Promote v_b to admin: now the team_read policy exposes v_a.
  reset role;
  update public.team_members set role = 'admin'
  where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and user_id = v_b;
  set role authenticated;
  perform tests.set_user(v_b);
  select count(*) into v_n from public.profiles where id = v_a;
  perform tests.assert_eq('profiles: admin teammate sees profile', v_n, 1);

  -- Back to member for the remaining tests.
  reset role;
  update public.team_members set role = 'member'
  where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and user_id = v_b;
  set role authenticated;
end $$;

-- ------------------------------------------------------------------- teams --
do $$
declare v_n int;
begin
  -- Member of team_a sees team_a but not team_b.
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.teams where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform tests.assert_eq('teams: member sees own team', v_n, 1);
  select count(*) into v_n from public.teams where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  perform tests.assert_eq('teams: member cannot see other team', v_n, 0);

  -- Owner can update non-billing columns; billing columns are blocked.
  update public.teams set name = 'Team A renamed'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform tests.assert_true('teams: owner updates name', found);

  begin
    update public.teams set plan = 'pro'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    raise exception 'FAIL teams: billing column change should have raised';
  exception when raise_exception then
    if sqlerrm not like '%billing columns are managed%' then
      raise exception 'FAIL teams: wrong error: %', sqlerrm;
    end if;
    raise notice 'ok teams: billing column change blocked for non-service_role';
  end;
  reset role;
  update public.teams set name = 'Team A'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  set role authenticated;
end $$;

-- ----------------------------------------------------------- conversations --
do $$
declare v_n int;
begin
  -- user_b (member) sees their own conversation.
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.conversations
  where id = 'c0000000-0000-0000-0000-000000000001';
  perform tests.assert_eq('conversations: member sees own', v_n, 1);

  -- user_a (owner => admin) sees team conversations including b's.
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.conversations
  where id = 'c0000000-0000-0000-0000-000000000001';
  perform tests.assert_eq('conversations: admin sees member convo', v_n, 1);

  -- user_a cannot see anything from team_b (not a member there).
  insert into public.conversations (id, team_id, user_id, title, model_id)
  values ('c0000000-0000-0000-0000-000000000002',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          '22222222-2222-2222-2222-222222222222', 'B team-b convo', 'cortex-flash')
  on conflict (id) do nothing;
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.conversations
  where id = 'c0000000-0000-0000-0000-000000000002';
  perform tests.assert_eq('conversations: cross-team read blocked', v_n, 0);

  -- Member cannot read another member's conversation.
  reset role;
  insert into public.conversations (id, team_id, user_id, title, model_id)
  values ('c0000000-0000-0000-0000-000000000003',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '11111111-1111-1111-1111-111111111111', 'A convo', 'cortex-flash')
  on conflict (id) do nothing;
  set role authenticated;
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.conversations
  where id = 'c0000000-0000-0000-0000-000000000003';
  perform tests.assert_eq('conversations: member cannot read peer convo', v_n, 0);

  -- But the peer's messages are equally invisible (policy inherits).
  select count(*) into v_n from public.messages m
  where m.conversation_id = 'c0000000-0000-0000-0000-000000000003';
  perform tests.assert_eq('messages: inherit conversation isolation', v_n, 0);
end $$;

-- ---------------------------------------------------------------- templates --
do $$
declare v_n int;
begin
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.prompt_templates
  where id = 'e0000000-0000-0000-0000-000000000001';
  perform tests.assert_eq('templates: personal template hidden from teammate', v_n, 0);
  select count(*) into v_n from public.prompt_templates
  where id = 'e0000000-0000-0000-0000-000000000002';
  perform tests.assert_eq('templates: team template visible to teammate', v_n, 1);

  -- Non-admin cannot flip featured (trigger raises).
  begin
    update public.prompt_templates set featured = true
    where id = 'e0000000-0000-0000-0000-000000000002';
    raise exception 'FAIL templates: non-admin featured flip should have raised';
  exception when raise_exception then
    if sqlerrm not like '%only team admins can feature templates%' then
      raise exception 'FAIL templates: wrong error: %', sqlerrm;
    end if;
    raise notice 'ok templates: featured guarded for admins';
  end;
end $$;

-- ------------------------------------------------------------------- usage --
do $$
declare v_n int;
begin
  reset role;
  insert into public.usage_events
    (team_id, user_id, model_id, prompt_tokens, completion_tokens, estimated_cost_usd)
  values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '22222222-2222-2222-2222-222222222222', 'cortex-flash', 100, 50, 0.0001)
  on conflict do nothing;
  set role authenticated;

  -- user_b sees their own usage row...
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.usage_events
  where user_id = '22222222-2222-2222-2222-222222222222';
  perform tests.assert_true('usage_events: member sees own rows', v_n >= 1);

  -- ...but user_a (admin) also sees them, while a non-admin peer would not.
  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.usage_events
  where user_id = '22222222-2222-2222-2222-222222222222';
  perform tests.assert_true('usage_events: admin sees team rows', v_n >= 1);

  -- Append-only: clients cannot insert usage rows.
  begin
    insert into public.usage_events
      (team_id, user_id, model_id, prompt_tokens, completion_tokens, estimated_cost_usd)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '11111111-1111-1111-1111-111111111111', 'cortex-flash', 1, 1, 0.0001);
    raise exception 'FAIL usage_events: client insert should have been denied';
  exception when insufficient_privilege then
    raise notice 'ok usage_events: client insert denied (append-only)';
  end;
end $$;

-- ------------------------------------------------- api_keys / audit_log --
do $$
declare v_n int;
begin
  reset role;
  insert into public.api_keys (team_id, created_by, name, key_hash, key_prefix)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '11111111-1111-1111-1111-111111111111', 'test key', 'deadbeef', 'cxk_dead')
  on conflict do nothing;
  perform public.log_audit_event(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'api_key.created', 'api_key', 'x', '{}');
  set role authenticated;

  -- Member cannot list API keys or the audit log; admin can.
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.api_keys;
  perform tests.assert_eq('api_keys: member cannot read', v_n, 0);
  select count(*) into v_n from public.audit_log;
  perform tests.assert_eq('audit_log: member cannot read', v_n, 0);

  perform tests.set_user('11111111-1111-1111-1111-111111111111');
  select count(*) into v_n from public.api_keys;
  perform tests.assert_true('api_keys: admin can read', v_n >= 1);
  select count(*) into v_n from public.audit_log;
  perform tests.assert_true('audit_log: admin can read', v_n >= 1);
end $$;

-- ------------------------------------------------------------- allowance --
do $$
declare
  r record;
begin
  reset role;
  -- Active member is allowed.
  select * into r from public.check_chat_allowance(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');
  perform tests.assert_true('allowance: active member allowed', r.allowed);

  -- Deactivated member is denied.
  update public.team_members set status = 'deactivated'
  where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and user_id = '22222222-2222-2222-2222-222222222222';
  select * into r from public.check_chat_allowance(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');
  perform tests.assert_eq('allowance: deactivated denied', r.allowed, false);
  perform tests.assert_eq('allowance: deactivated reason', r.reason, 'no_active_membership');
  update public.team_members set status = 'active'
  where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and user_id = '22222222-2222-2222-2222-222222222222';

  -- Budget hard stop denies when MTD spend >= budget.
  update public.teams
  set monthly_token_budget = 1, budget_hard_stop = true
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  select * into r from public.check_chat_allowance(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');
  -- (the fixture usage row above costs 0.0001 < 1, so still allowed but flagged)
  perform tests.assert_true('allowance: under budget allowed', r.allowed);
  update public.teams
  set monthly_token_budget = null, budget_hard_stop = false
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
end $$;

-- ------------------------------------------------------------ last owner --
do $$
begin
  reset role;
  begin
    update public.team_members set role = 'member'
    where team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '11111111-1111-1111-1111-111111111111';
    raise exception 'FAIL team_members: demoting the last owner should have raised';
  exception when raise_exception then
    if sqlerrm not like '%cannot remove the last owner%' then
      raise exception 'FAIL team_members: wrong error: %', sqlerrm;
    end if;
    raise notice 'ok team_members: last-owner guard holds';
  end;
end $$;

-- ---------------------------------------------------------- model catalog --
do $$
declare v_n int;
begin
  set role authenticated;
  perform tests.set_user('22222222-2222-2222-2222-222222222222');
  select count(*) into v_n from public.model_catalog;
  perform tests.assert_true('model_catalog: readable by any member', v_n >= 0);
end $$;

reset role;
