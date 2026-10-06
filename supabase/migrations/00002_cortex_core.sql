-- =============================================================================
-- 00002_cortex_core.sql — Cortex core schema (Phase 2)
--
--   Extends the starter (00001_init.sql: profiles + handle_new_user) with the
--   full Cortex application schema: teams, memberships, invites,
--   conversations, messages (+ FTS sidecar), prompt templates (+ versions),
--   usage metering, API keys, audit log, and the seeded model catalog.
--
--   Conventions: uuid PKs via gen_random_uuid(), timestamptz everywhere,
--   updated_at maintained by trigger, soft-delete via deleted_at where noted.
--   Every table has RLS enabled with team-scoped policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: extend the starter's table to the Cortex shape
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists default_model_id text not null default 'cortex-flash',
  add column if not exists default_temperature numeric(3,2) not null default 0.70,
  add column if not exists email_digest_opt_in boolean not null default false;

alter table public.profiles
  add constraint profiles_default_temperature_check
  check (default_temperature >= 0 and default_temperature <= 2);

alter table public.profiles
  add constraint profiles_active_team_fk
  foreign key (active_team_id) references public.teams (id) on delete set null;

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
create table public.teams (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null check (char_length(name) between 2 and 60),
  slug                      text unique not null,
  logo_url                  text,
  plan                      text not null default 'starter' check (plan in ('starter','pro','team')),
  seat_count                int  not null default 1 check (seat_count > 0),
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  monthly_token_budget      bigint, -- null = unlimited
  budget_hard_stop          boolean not null default false,
  budget_alert_80_sent_at   timestamptz,
  budget_alert_100_sent_at  timestamptz,
  default_model_id          text not null default 'cortex-flash',
  default_temperature       numeric(3,2) not null default 0.70,
  fallback_model_id         text not null default 'cortex-flash',
  retention_days            int  not null default 365 check (retention_days in (30, 90, 365)),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','admin','member')),
  status     text not null default 'active' check (status in ('active','invited','deactivated')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create index team_members_team_idx on public.team_members (team_id, status);
create index team_members_user_idx on public.team_members (user_id, status);

-- ---------------------------------------------------------------------------
-- team_invites
-- ---------------------------------------------------------------------------
create table public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  email       citext not null,
  role        text not null default 'member' check (role in ('admin','member')),
  token_hash  text unique not null, -- SHA-256 hex of the raw token
  invited_by  uuid not null references public.profiles (id),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (team_id, email)
);
-- Only one *pending* invite per (team, email); accepted invites may repeat.
create unique index team_invites_pending_unique
  on public.team_invites (team_id, email) where accepted_at is null;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table public.conversations (
  id                     uuid primary key default gen_random_uuid(),
  team_id                uuid not null references public.teams (id) on delete cascade,
  user_id                uuid not null references public.profiles (id) on delete cascade,
  title                  text not null default 'New conversation',
  model_id               text not null,
  temperature            numeric(3,2), -- null = team default at send time
  folder                 text,
  pinned                 boolean not null default false,
  template_id            uuid references public.prompt_templates (id) on delete set null,
  search_vector          tsvector,
  message_count          int not null default 0,
  total_prompt_tokens    bigint not null default 0,
  total_completion_tokens bigint not null default 0,
  last_message_at        timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
);
create index conversations_team_user_idx
  on public.conversations (team_id, user_id, last_message_at desc);
create index conversations_search_gin on public.conversations using gin (search_vector);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations (id) on delete cascade,
  role              text not null check (role in ('user','assistant','system')),
  content           text not null,
  status            text not null default 'complete'
                    check (status in ('streaming','complete','error','stopped')),
  model_id          text, -- assistant messages
  prompt_tokens     int not null default 0,
  completion_tokens int not null default 0,
  latency_ms        int,  -- time to first token
  total_duration_ms int,
  version           int not null default 1, -- regeneration versions; latest = max
  parent_version_id uuid references public.messages (id),
  attachment_urls   text[] not null default '{}',
  attachment_text   text, -- extracted, capped at 50k chars
  citations         jsonb, -- RAG citations [{chunk_id, document_id, label, score}]
  error_code        text,  -- provider_unavailable, rate_limited, ...
  created_at        timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_version_idx on public.messages (conversation_id, version);

-- ---------------------------------------------------------------------------
-- message_search — FTS sidecar (keeps messages writes light)
-- ---------------------------------------------------------------------------
create table public.message_search (
  message_id      uuid primary key references public.messages (id) on delete cascade,
  conversation_id uuid not null,
  search_vector   tsvector not null
);
create index message_search_gin on public.message_search using gin (search_vector);
create index message_search_conversation_idx on public.message_search (conversation_id);

-- ---------------------------------------------------------------------------
-- prompt_templates + versions (append-only history)
-- ---------------------------------------------------------------------------
create table public.prompt_templates (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  name        text not null check (char_length(name) between 3 and 80),
  description text not null default '',
  category    text not null default 'General',
  prompt_body text not null, -- may contain {{variable}} placeholders
  variables   jsonb not null default '[]', -- [{name, label, default_value, required}]
  visibility  text not null default 'personal' check (visibility in ('personal','team')),
  featured    boolean not null default false,
  version     int not null default 1,
  run_count   bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index prompt_templates_team_idx on public.prompt_templates (team_id, visibility);
create index prompt_templates_category_idx on public.prompt_templates (team_id, category);

create table public.prompt_template_versions (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.prompt_templates (id) on delete cascade,
  version     int not null,
  prompt_body text not null,
  variables   jsonb not null,
  edited_by   uuid not null references public.profiles (id),
  created_at  timestamptz not null default now(),
  unique (template_id, version)
);

-- ---------------------------------------------------------------------------
-- usage_events (append-only) + usage_daily (rollup)
-- ---------------------------------------------------------------------------
create table public.usage_events (
  id                      bigint primary key generated always as identity,
  team_id                 uuid not null,
  user_id                 uuid not null,
  conversation_id         uuid,
  message_id              uuid,
  api_key_id              uuid references public.api_keys (id) on delete set null,
  template_id             uuid,
  model_id                text not null,
  prompt_tokens           int not null,
  completion_tokens       int not null,
  estimated_cost_usd      numeric(10,6) not null,
  latency_ms              int,
  rag_embedding_tokens    int,
  rag_retrieval_latency_ms int,
  created_at              timestamptz not null default now()
);
create index usage_events_team_idx on public.usage_events (team_id, created_at desc);
create index usage_events_user_idx on public.usage_events (user_id, created_at desc);
create index usage_events_key_idx on public.usage_events (api_key_id, created_at desc);

create table public.usage_daily (
  team_id            uuid not null,
  user_id            uuid, -- null = team total row
  model_id           text not null default '*', -- '*' = all-models row
  day                date not null,
  prompt_tokens      bigint not null default 0,
  completion_tokens  bigint not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  message_count      int not null default 0,
  unique (team_id, user_id, model_id, day)
);

-- ---------------------------------------------------------------------------
-- api_keys
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams (id) on delete cascade,
  created_by   uuid not null references public.profiles (id),
  name         text not null,
  key_hash     text unique not null, -- SHA-256 hex of the cxk_... secret
  key_prefix   text not null,         -- first 10 chars for display
  scopes       text[] not null default '{chat}' check (scopes <@ array['chat']),
  expires_at   timestamptz,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_log (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          bigint primary key generated always as identity,
  team_id     uuid not null,
  actor_id    uuid not null references public.profiles (id),
  action      text not null,
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index audit_log_team_idx on public.audit_log (team_id, created_at desc);

-- ---------------------------------------------------------------------------
-- model_catalog (seeded, read-only to clients)
-- ---------------------------------------------------------------------------
create table public.model_catalog (
  model_id            text primary key,
  display_name        text not null,
  provider            text not null,
  provider_model      text not null,
  input_price_per_1k  numeric(10,6) not null,
  output_price_per_1k numeric(10,6) not null,
  context_window      int not null,
  max_output_tokens   int not null,
  enabled             boolean not null default true,
  sort_order          int not null default 0
);

-- ===========================================================================
-- updated_at trigger
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['teams','team_members','conversations','prompt_templates','profiles']
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I;
       create trigger trg_set_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ===========================================================================
-- Auth helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ===========================================================================
create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.team_role(p_team_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.team_members
  where team_id = p_team_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.team_role(p_team_id) in ('owner','admin');
$$;

-- ===========================================================================
-- handle_new_user — create profile + auto-accept pending invite on email match
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  -- Auto-accept a pending invite whose email matches (invite-by-email flow).
  select * into v_invite
  from public.team_invites
  where email = new.email::citext
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if found then
    insert into public.team_members (team_id, user_id, role, status, invited_by)
    values (v_invite.team_id, new.id, v_invite.role, 'active', v_invite.invited_by)
    on conflict (team_id, user_id) do update
      set status = 'active', role = excluded.role;

    update public.team_invites
    set accepted_at = now()
    where id = v_invite.id;

    update public.profiles
    set active_team_id = v_invite.team_id
    where id = new.id and active_team_id is null;
  end if;

  return new;
end;
$$;

-- ===========================================================================
-- create_team_with_owner — signup creates team + owner membership atomically
-- ===========================================================================
create or replace function public.create_team_with_owner(
  p_team_name text,
  p_team_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if char_length(p_team_name) < 2 or char_length(p_team_name) > 60 then
    raise exception 'team name must be 2-60 characters';
  end if;

  insert into public.teams (name, slug)
  values (p_team_name, p_team_slug)
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role, status)
  values (v_team_id, v_uid, 'owner', 'active');

  update public.profiles
  set active_team_id = v_team_id
  where id = v_uid;

  return v_team_id;
end;
$$;

-- ===========================================================================
-- ensure_last_owner — never demote/remove the final owner
-- ===========================================================================
create or replace function public.ensure_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count int;
begin
  if tg_op = 'DELETE' then
    select count(*) into v_owner_count
    from public.team_members
    where team_id = old.team_id and role = 'owner' and status = 'active'
      and id <> old.id;
  else
    -- UPDATE that strips owner role or deactivates an owner
    if old.role = 'owner' and old.status = 'active'
       and (new.role <> 'owner' or new.status <> 'active') then
      select count(*) into v_owner_count
      from public.team_members
      where team_id = old.team_id and role = 'owner' and status = 'active'
        and id <> old.id;
    else
      return new;
    end if;
  end if;

  if v_owner_count = 0 then
    raise exception 'cannot remove the last owner of a team';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_ensure_last_owner on public.team_members;
create trigger trg_ensure_last_owner
  before update or delete on public.team_members
  for each row execute function public.ensure_last_owner();

-- ===========================================================================
-- protect_billing_columns — plan / stripe / seats only changeable by service_role
-- ===========================================================================
create or replace function public.protect_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) <> 'service_role' then
    if new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.seat_count is distinct from old.seat_count then
      raise exception 'billing columns are managed by the billing system';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_billing_columns on public.teams;
create trigger trg_protect_billing_columns
  before update on public.teams
  for each row execute function public.protect_billing_columns();

-- ===========================================================================
-- conversations.search_vector maintenance (title only; bodies live in message_search)
-- ===========================================================================
create or replace function public.maintain_conversation_search_vector()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.title, ''));
  return new;
end;
$$;

drop trigger if exists trg_conversation_search_vector on public.conversations;
create trigger trg_conversation_search_vector
  before insert or update of title on public.conversations
  for each row execute function public.maintain_conversation_search_vector();

-- ===========================================================================
-- message_search maintenance from messages.content
-- ===========================================================================
create or replace function public.maintain_message_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.message_search (message_id, conversation_id, search_vector)
  values (new.id, new.conversation_id, to_tsvector('english', coalesce(new.content, '')))
  on conflict (message_id) do update
    set conversation_id = excluded.conversation_id,
        search_vector   = excluded.search_vector;
  return new;
end;
$$;

drop trigger if exists trg_message_search on public.messages;
create trigger trg_message_search
  after insert or update of content on public.messages
  for each row execute function public.maintain_message_search();

-- ===========================================================================
-- check_chat_allowance — pre-flight gate for /api/chat and /api/rag/ask
-- Returns: { allowed boolean, reason text, budget_pct numeric }
-- ===========================================================================
create or replace function public.check_chat_allowance(p_team_id uuid, p_user_id uuid)
returns table (allowed boolean, reason text, budget_pct numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_seat_count int;
  v_active_count int;
  v_budget bigint;
  v_hard_stop boolean;
  v_mtd_cost numeric;
  v_plan text;
begin
  select status into v_status
  from public.team_members
  where team_id = p_team_id and user_id = p_user_id;

  if v_status is null or v_status <> 'active' then
    return query select false, 'no_active_membership'::text, 0::numeric;
    return;
  end if;

  select t.seat_count, t.monthly_token_budget, t.budget_hard_stop, t.plan
    into v_seat_count, v_budget, v_hard_stop, v_plan
  from public.teams t where t.id = p_team_id;

  select count(*) into v_active_count
  from public.team_members
  where team_id = p_team_id and status = 'active';

  if v_active_count > v_seat_count then
    return query select false, 'seat_limit_exceeded'::text, 0::numeric;
    return;
  end if;

  if v_budget is not null then
    select coalesce(sum(estimated_cost_usd), 0) into v_mtd_cost
    from public.usage_events
    where team_id = p_team_id
      and created_at >= date_trunc('month', now());

    if v_mtd_cost >= v_budget and v_hard_stop then
      return query select false, 'budget_hard_stop'::text, 100::numeric;
      return;
    end if;

    return query select true, 'ok'::text,
      least(100, round((v_mtd_cost / greatest(v_budget, 1)) * 100, 1));
    return;
  end if;

  return query select true, 'ok'::text, 0::numeric;
end;
$$;

-- ===========================================================================
-- finalize_message — persist a finished assistant message + usage, idempotent
-- Called from /api/chat onFinish (and /api/rag/ask) as service_role.
-- Idempotency: the caller passes a client-generated message id; a repeat
-- call with the same id updates rather than duplicating usage rows.
-- ===========================================================================
create or replace function public.finalize_message(
  p_message_id uuid,
  p_conversation_id uuid,
  p_content text,
  p_model_id text,
  p_prompt_tokens int,
  p_completion_tokens int,
  p_latency_ms int,
  p_total_duration_ms int,
  p_status text,
  p_estimated_cost_usd numeric,
  p_citations jsonb default null,
  p_template_id uuid default null,
  p_rag_embedding_tokens int default null,
  p_rag_retrieval_latency_ms int default null,
  p_error_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_user_id uuid;
  v_already_finalized boolean;
begin
  select team_id, user_id into v_team_id, v_user_id
  from public.conversations where id = p_conversation_id;

  if v_team_id is null then
    raise exception 'conversation not found';
  end if;

  select exists(
    select 1 from public.usage_events where message_id = p_message_id
  ) into v_already_finalized;

  -- Upsert the assistant message (streaming row may already exist).
  insert into public.messages
    (id, conversation_id, role, content, status, model_id,
     prompt_tokens, completion_tokens, latency_ms, total_duration_ms,
     citations, error_code)
  values
    (p_message_id, p_conversation_id, 'assistant', p_content, p_status, p_model_id,
     p_prompt_tokens, p_completion_tokens, p_latency_ms, p_total_duration_ms,
     p_citations, p_error_code)
  on conflict (id) do update set
    content = excluded.content,
    status = excluded.status,
    prompt_tokens = excluded.prompt_tokens,
    completion_tokens = excluded.completion_tokens,
    latency_ms = excluded.latency_ms,
    total_duration_ms = excluded.total_duration_ms,
    citations = excluded.citations,
    error_code = excluded.error_code;

  -- Usage row exactly once (idempotent on abort/retry).
  if not v_already_finalized and p_status in ('complete','stopped') then
    insert into public.usage_events
      (team_id, user_id, conversation_id, message_id, template_id, model_id,
       prompt_tokens, completion_tokens, estimated_cost_usd, latency_ms,
       rag_embedding_tokens, rag_retrieval_latency_ms)
    values
      (v_team_id, v_user_id, p_conversation_id, p_message_id, p_template_id, p_model_id,
       p_prompt_tokens, p_completion_tokens, p_estimated_cost_usd, p_latency_ms,
       p_rag_embedding_tokens, p_rag_retrieval_latency_ms);

    -- Near-real-time rollup for the dashboard.
    insert into public.usage_daily
      (team_id, user_id, model_id, day, prompt_tokens, completion_tokens,
       estimated_cost_usd, message_count)
    values
      (v_team_id, v_user_id, p_model_id, current_date,
       p_prompt_tokens, p_completion_tokens, p_estimated_cost_usd, 1),
      (v_team_id, v_user_id, '*', current_date,
       p_prompt_tokens, p_completion_tokens, p_estimated_cost_usd, 1),
      (v_team_id, null, '*', current_date,
       p_prompt_tokens, p_completion_tokens, p_estimated_cost_usd, 1)
    on conflict (team_id, user_id, model_id, day) do update set
      prompt_tokens = public.usage_daily.prompt_tokens + excluded.prompt_tokens,
      completion_tokens = public.usage_daily.completion_tokens + excluded.completion_tokens,
      estimated_cost_usd = public.usage_daily.estimated_cost_usd + excluded.estimated_cost_usd,
      message_count = public.usage_daily.message_count + 1;
  end if;

  -- Denormalized conversation counters.
  update public.conversations
  set message_count = message_count + 1,
      total_prompt_tokens = total_prompt_tokens + p_prompt_tokens,
      total_completion_tokens = total_completion_tokens + p_completion_tokens,
      last_message_at = now()
  where id = p_conversation_id;

  return p_message_id;
end;
$$;

-- ===========================================================================
-- log_audit_event — append-only admin action log (service_role writes)
-- ===========================================================================
create or replace function public.log_audit_event(
  p_team_id uuid,
  p_actor_id uuid,
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_metadata jsonb default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v_id bigint;
begin
  insert into public.audit_log (team_id, actor_id, action, target_type, target_id, metadata)
  values (p_team_id, p_actor_id, p_action, p_target_type, p_target_id, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

-- ===========================================================================
-- Template versioning: snapshot the previous version before an edit
-- ===========================================================================
create or replace function public.snapshot_template_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.prompt_body is distinct from old.prompt_body
     or new.variables is distinct from old.variables then
    insert into public.prompt_template_versions
      (template_id, version, prompt_body, variables, edited_by)
    values
      (old.id, old.version, old.prompt_body, old.variables, auth.uid());
    new.version = old.version + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_snapshot_template_version on public.prompt_templates;
create trigger trg_snapshot_template_version
  before update of prompt_body, variables on public.prompt_templates
  for each row execute function public.snapshot_template_version();

-- Only admins may flip `featured`.
create or replace function public.guard_template_featured()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.featured is distinct from old.featured
     and not public.is_team_admin(old.team_id) then
    raise exception 'only team admins can feature templates';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_template_featured on public.prompt_templates;
create trigger trg_guard_template_featured
  before update of featured on public.prompt_templates
  for each row execute function public.guard_template_featured();

-- active_team_id must reference a team the user belongs to
create or replace function public.guard_active_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active_team_id is not null then
    if not exists (
      select 1 from public.team_members
      where team_id = new.active_team_id
        and user_id = new.id
        and status = 'active'
    ) then
      raise exception 'active_team_id must reference a team the user belongs to';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_active_team on public.profiles;
create trigger trg_guard_active_team
  before update of active_team_id on public.profiles
  for each row execute function public.guard_active_team();

-- ===========================================================================
-- RLS — enable on every table
-- ===========================================================================
alter table public.profiles               enable row level security;
alter table public.teams                  enable row level security;
alter table public.team_members           enable row level security;
alter table public.team_invites           enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.message_search         enable row level security;
alter table public.prompt_templates       enable row level security;
alter table public.prompt_template_versions enable row level security;
alter table public.usage_events           enable row level security;
alter table public.usage_daily            enable row level security;
alter table public.api_keys               enable row level security;
alter table public.audit_log              enable row level security;
alter table public.model_catalog          enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Team admins can read member profiles for member tables.
create policy profiles_team_read on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.team_members m1
      join public.team_members m2 on m1.team_id = m2.team_id
      where m1.user_id = auth.uid()
        and m1.status = 'active'
        and m1.role in ('owner','admin')
        and m2.user_id = public.profiles.id
        and m2.status = 'active'
    )
  );

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
create policy teams_member_select on public.teams
  for select to authenticated
  using (public.is_team_member(id) and deleted_at is null);

create policy teams_create on public.teams
  for insert to authenticated
  with check (true); -- create_team_with_owner() does the privileged work

create policy teams_admin_update on public.teams
  for update to authenticated
  using (public.is_team_admin(id))
  with check (public.is_team_admin(id));

create policy teams_owner_delete on public.teams
  for delete to authenticated
  using (public.team_role(id) = 'owner');

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create policy team_members_select on public.team_members
  for select to authenticated
  using (public.is_team_member(team_id));

create policy team_members_admin_write on public.team_members
  for all to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- ---------------------------------------------------------------------------
-- team_invites
-- ---------------------------------------------------------------------------
create policy team_invites_admin on public.team_invites
  for all to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- ---------------------------------------------------------------------------
-- conversations — members see own; admins see all in team
-- ---------------------------------------------------------------------------
create policy conversations_select on public.conversations
  for select to authenticated
  using (
    deleted_at is null
    and public.is_team_member(team_id)
    and (user_id = auth.uid() or public.is_team_admin(team_id))
  );

create policy conversations_insert on public.conversations
  for insert to authenticated
  with check (
    public.is_team_member(team_id) and user_id = auth.uid()
  );

create policy conversations_update on public.conversations
  for update to authenticated
  using (
    public.is_team_member(team_id)
    and (user_id = auth.uid() or public.is_team_admin(team_id))
  )
  with check (
    public.is_team_member(team_id)
    and (user_id = auth.uid() or public.is_team_admin(team_id))
  );

-- No client DELETE (soft delete via UPDATE setting deleted_at); hard purge is
-- a scheduled service_role job.

-- ---------------------------------------------------------------------------
-- messages / message_search — inherit the conversation predicate
-- ---------------------------------------------------------------------------
create policy messages_select on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.deleted_at is null
        and public.is_team_member(c.team_id)
        and (c.user_id = auth.uid() or public.is_team_admin(c.team_id))
    )
  );

-- No INSERT/UPDATE/DELETE for clients: all writes go through /api/chat as
-- service_role (finalize_message). service_role bypasses RLS.

create policy message_search_select on public.message_search
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = message_search.conversation_id
        and c.deleted_at is null
        and public.is_team_member(c.team_id)
        and (c.user_id = auth.uid() or public.is_team_admin(c.team_id))
    )
  );

-- ---------------------------------------------------------------------------
-- prompt_templates
-- ---------------------------------------------------------------------------
create policy prompt_templates_select on public.prompt_templates
  for select to authenticated
  using (
    deleted_at is null
    and public.is_team_member(team_id)
    and (
      visibility = 'team'
      or author_id = auth.uid()
      or public.is_team_admin(team_id)
    )
  );

create policy prompt_templates_insert on public.prompt_templates
  for insert to authenticated
  with check (
    public.is_team_member(team_id) and author_id = auth.uid()
  );

create policy prompt_templates_update on public.prompt_templates
  for update to authenticated
  using (
    public.is_team_member(team_id)
    and (author_id = auth.uid() or public.is_team_admin(team_id))
  )
  with check (
    public.is_team_member(team_id)
    and (author_id = auth.uid() or public.is_team_admin(team_id))
  );

-- Soft delete only (UPDATE setting deleted_at); no client DELETE.

create policy prompt_template_versions_select on public.prompt_template_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.prompt_templates t
      where t.id = prompt_template_versions.template_id
        and t.deleted_at is null
        and public.is_team_member(t.team_id)
        and (t.visibility = 'team' or t.author_id = auth.uid() or public.is_team_admin(t.team_id))
    )
  );

-- ---------------------------------------------------------------------------
-- usage_events / usage_daily — own rows, or all team rows for admins
-- ---------------------------------------------------------------------------
create policy usage_events_select on public.usage_events
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_team_admin(team_id)
  );

create policy usage_daily_select on public.usage_daily
  for select to authenticated
  using (
    (user_id = auth.uid())
    or (user_id is null and public.is_team_admin(team_id))
  );

-- Append-only: no client INSERT/UPDATE/DELETE (service_role writes).

-- ---------------------------------------------------------------------------
-- api_keys
-- ---------------------------------------------------------------------------
create policy api_keys_admin on public.api_keys
  for all to authenticated
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

-- ---------------------------------------------------------------------------
-- audit_log — admin read; service_role writes via log_audit_event()
-- ---------------------------------------------------------------------------
create policy audit_log_admin_select on public.audit_log
  for select to authenticated
  using (public.is_team_admin(team_id));

-- ---------------------------------------------------------------------------
-- model_catalog — readable by any signed-in user; no client writes
-- ---------------------------------------------------------------------------
create policy model_catalog_select on public.model_catalog
  for select to authenticated
  using (true);
