-- The Raptor Nest: hub features (bulletin categories/events/pinning + to-dos)
-- Run once in the Supabase SQL editor before using the real (non-demo) app.
-- The demo build doesn't need this; it keeps its data in the browser.

-- 1. Bulletin: categories, pinning, and optional event details
alter table public.bulletin
  add column if not exists category text not null default 'School'
    check (category in ('School', 'Club', 'Event')),
  add column if not exists pinned boolean not null default false,
  add column if not exists event_date date,
  add column if not exists event_time text,
  add column if not exists location text;

create index if not exists bulletin_event_date_idx on public.bulletin (event_date);

-- Everyone signed in can read the bulletin; only admins can post, pin or delete
alter table public.bulletin enable row level security;

drop policy if exists "bulletin readable by signed-in users" on public.bulletin;
create policy "bulletin readable by signed-in users"
  on public.bulletin for select to authenticated using (true);

drop policy if exists "admins manage bulletin" on public.bulletin;
create policy "admins manage bulletin"
  on public.bulletin for all to authenticated
  using (exists (select 1 from public.admins a where a.id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- 2. Personal to-do lists (only the owner can see or change their items)
create table if not exists public.todos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_idx on public.todos (user_id);

alter table public.todos enable row level security;

drop policy if exists "own todos" on public.todos;
create policy "own todos"
  on public.todos for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
