-- Retry from the failed step, resumable render jobs, push notifications.

alter table contents    add column if not exists failed_status text;
alter table render_jobs add column if not exists payload jsonb;
create index if not exists render_jobs_status_idx on render_jobs (status, created_at);

create table if not exists push_subscriptions (
  id            uuid primary key,
  endpoint      text not null unique,
  subscription  jsonb not null,
  user_agent    text,
  created_at    timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
