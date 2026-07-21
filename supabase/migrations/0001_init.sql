-- 0001_init.sql — Helm initial migration for Supabase
-- Run via `supabase db push` / SQL editor, or let drizzle-kit generate from schema.ts
-- and then append the RLS + vector-index section below (drizzle doesn't emit RLS).
-- This file is the canonical bootstrap for local (`supabase start`) and hosted Supabase.

-- ============ extensions ============
create extension if not exists vector;        -- pgvector
create extension if not exists pgcrypto;      -- gen_random_uuid

-- ============ enums ============
create type connection_kind as enum ('gmail','stripe');
create type connection_status as enum ('active','error','revoked');
create type contact_kind as enum ('lead','customer','investor','other');
create type interaction_kind as enum ('email_in','email_out','call_notes','stripe_event');
create type sentiment as enum ('positive','neutral','negative','at_risk');
create type watch_kind as enum ('competitor','icp_keyword','community');
create type signal_kind as enum ('quiet_lead','failed_payment','subscription_canceled','renewal_risk','unanswered','commitment_due','competitor_move','icp_thread','positive');
create type signal_source as enum ('gmail','stripe','notes','watchlist','rules');
create type action_kind as enum ('email_reply','email_followup','social_post_draft','task');
create type action_status as enum ('proposed','edited','approved','executed','dismissed','failed');
create type run_trigger as enum ('nightly','manual','canary');
create type run_status as enum ('running','completed','degraded','failed');

-- ============ tables ============
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  company_name text,
  product_description text,
  icp_description text,
  tz text not null default 'Europe/Berlin',
  voice_samples jsonb default '[]',
  is_sandbox boolean not null default false,
  gmail_test_user_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind connection_kind not null,
  credentials_encrypted text not null,
  status connection_status not null default 'active',
  last_sync_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  email text,
  name text,
  company text,
  company_key text,
  kind contact_kind not null default 'other',
  stripe_customer_id text,
  plan_eur_monthly numeric,
  language text default 'en',
  created_at timestamptz not null default now(),
  unique (user_id, email)
);
create index contacts_user on contacts(user_id);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  kind interaction_kind not null,
  occurred_at timestamptz not null,
  source_ref text,
  thread_ref text,
  raw_text text,
  summary text,
  sentiment sentiment,
  sentiment_evidence text,
  extraction jsonb,
  authored_by_founder boolean not null default false,
  injection_suspected boolean not null default false,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (user_id, kind, source_ref)
);
create index interactions_user_time on interactions(user_id, occurred_at);
create index interactions_contact_time on interactions(contact_id, occurred_at);
-- ANN index for the ask-box (HNSW; build after seed for speed)
create index interactions_embedding_hnsw on interactions
  using hnsw (embedding vector_cosine_ops);

create table watch_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind watch_kind not null,
  value text not null,
  notes text,
  allowed_domains jsonb default '[]',
  created_at timestamptz not null default now()
);

create table watch_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  watch_item_id uuid not null references watch_items(id) on delete cascade,
  url_canonical text not null,
  title text,
  snippet text,
  published_hint text,
  scoring jsonb,
  embedding vector(1536),
  seen_at timestamptz not null default now(),
  unique (user_id, url_canonical)
);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  trigger run_trigger not null,
  status run_status not null default 'running',
  steps_json jsonb default '[]',
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric not null default 0,
  actions_proposed integer not null default 0,
  actions_executed integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index runs_user_time on agent_runs(user_id, started_at);

create table signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  run_id uuid references agent_runs(id) on delete set null,
  kind signal_kind not null,
  source signal_source not null,
  contact_id uuid references contacts(id) on delete cascade,
  watch_item_id uuid references watch_items(id) on delete set null,
  watch_contact_edge jsonb default '[]',
  base_urgency integer not null check (base_urgency between 1 and 5),
  evidence jsonb not null,
  evidence_hash text not null,
  created_at timestamptz not null default now()
);
create index signals_user_run on signals(user_id, run_id);

create table briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  run_id uuid references agent_runs(id) on delete set null,
  brief_date text not null,
  headline text not null,
  items_json jsonb not null,
  skipped_count integer not null default 0,
  skipped_summary text,
  carryover_note text,
  degraded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, brief_date)
);

create table actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  brief_id uuid references briefs(id) on delete cascade,
  signal_id uuid references signals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  kind action_kind not null,
  status action_status not null default 'proposed',
  draft_subject text,
  draft_body text not null,
  draft_meta jsonb,
  was_edited boolean not null default false,
  gate_failures jsonb default '[]',
  used_template_fallback boolean not null default false,
  human_approved_at timestamptz,
  executed_at timestamptz,
  execution_ref text,
  created_at timestamptz not null default now()
);
create index actions_user_status on actions(user_id, status);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'none',
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ============ RLS: user isolation (Supabase) ============
-- Server code using the service-role key bypasses RLS (pipeline/cron).
-- Client-side reads with the anon key are locked to the owning user.
do $$
declare t text;
begin
  foreach t in array array['users','connections','contacts','interactions','watch_items',
    'watch_findings','agent_runs','signals','briefs','actions','subscriptions']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

create policy users_own on users for all
  using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['connections','contacts','interactions','watch_items',
    'watch_findings','agent_runs','signals','briefs','actions','subscriptions']
  loop
    execute format(
      'create policy %I_own on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t);
  end loop;
end $$;

-- The anonymous sandbox never queries these tables directly. A server-only
-- endpoint using the service role returns a deliberately limited fixture DTO;
-- the service-role key must never reach the browser. Sandbox approval is a
-- client-side simulation and never writes to the shared fixture or calls Gmail.
