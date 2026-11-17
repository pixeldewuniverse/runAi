-- RunAI / AI Office — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- The app talks to these tables with the service-role key from the server only,
-- so RLS is enabled with no policies (= no public access via the anon key).

create table if not exists agent_status (
  id          text primary key,
  state       text not null default 'idle',
  room        text not null default 'lounge',
  task        text,
  updated_at  timestamptz not null default now()
);

create table if not exists events (
  id          uuid primary key,
  agent_id    text not null,
  kind        text not null default 'info',
  message     text not null,
  ref_type    text,
  ref_id      uuid,
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx on events (created_at desc);

create table if not exists contents (
  id          uuid primary key,
  status      text not null,
  title       text,
  trends      jsonb,
  ideas       jsonb,
  picked      jsonb,
  script      jsonb,
  storyboard  jsonb,
  scenes      jsonb,
  publish     jsonb,
  video_url   text,
  feedback    text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists contents_created_idx on contents (created_at desc);

create table if not exists render_jobs (
  id          uuid primary key,
  content_id  uuid not null references contents(id) on delete cascade,
  status      text not null default 'queued',
  output_url  text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists brainstorms (
  id          uuid primary key,
  title       text not null,
  idea        text not null,
  status      text not null,
  brief       jsonb,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists brainstorm_messages (
  id          uuid primary key,
  session_id  uuid not null references brainstorms(id) on delete cascade,
  author      text not null,
  body        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists brainstorm_messages_session_idx on brainstorm_messages (session_id, created_at);

create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table agent_status        enable row level security;
alter table events              enable row level security;
alter table contents            enable row level security;
alter table render_jobs         enable row level security;
alter table brainstorms         enable row level security;
alter table brainstorm_messages enable row level security;
alter table settings            enable row level security;

-- Public bucket for rendered videos and voice-overs (written by the render worker).
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;
