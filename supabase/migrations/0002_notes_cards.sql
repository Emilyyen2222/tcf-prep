-- 自己的文法筆記、自己加的單字卡、單字卡複習進度
-- 在 Supabase Dashboard → SQL Editor 貼上執行一次即可（要先跑過 0001）。
-- 內建的筆記和單字放在 repo 的 data/notes.json、data/vocab.json，不進資料庫。

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null,
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes (user_id, updated_at);

create table if not exists public.cards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fr         text not null,
  zh         text not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists cards_user_idx on public.cards (user_id, created_at);

-- card_id 可能是內建單字（v-xxx）或自己加的單字（uuid），所以用 text
create table if not exists public.card_progress (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id     text not null,
  box         smallint not null default 0,
  due_on      date not null,
  reviewed_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.notes         enable row level security;
alter table public.cards         enable row level security;
alter table public.card_progress enable row level security;

drop policy if exists "own notes" on public.notes;
drop policy if exists "own cards" on public.cards;
drop policy if exists "own card progress" on public.card_progress;
create policy "own notes" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own cards" on public.cards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own card progress" on public.card_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.notes         to authenticated;
grant select, insert, update, delete on public.cards         to authenticated;
grant select, insert, update, delete on public.card_progress to authenticated;
