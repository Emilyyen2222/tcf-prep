-- tcf-prep 初始資料表
-- 在 Supabase Dashboard → SQL Editor 貼上執行一次即可。
-- 題目本身放在 repo 的 data/questions/*.json，資料庫只存「你的作答紀錄」和「模擬考分數」。

create table if not exists public.attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null,
  chosen      smallint not null,
  correct     boolean not null,
  created_at  timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts (user_id, created_at);

create table if not exists public.mock_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  taken_on   date not null,
  source     text not null default 'TV5MONDE',
  section    text not null check (section in ('CO', 'CE', 'EE', 'EO', 'full')),
  score      numeric not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists mock_scores_user_idx on public.mock_scores (user_id, taken_on);

-- Row Level Security：每個人只能看到、寫入自己的資料
alter table public.attempts    enable row level security;
alter table public.mock_scores enable row level security;

drop policy if exists "own attempts select" on public.attempts;
drop policy if exists "own attempts insert" on public.attempts;
create policy "own attempts select" on public.attempts for select to authenticated using (user_id = (select auth.uid()));
create policy "own attempts insert" on public.attempts for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "own mocks select" on public.mock_scores;
drop policy if exists "own mocks insert" on public.mock_scores;
drop policy if exists "own mocks delete" on public.mock_scores;
create policy "own mocks select" on public.mock_scores for select to authenticated using (user_id = (select auth.uid()));
create policy "own mocks insert" on public.mock_scores for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own mocks delete" on public.mock_scores for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert on public.attempts to authenticated;
grant select, insert, delete on public.mock_scores to authenticated;
