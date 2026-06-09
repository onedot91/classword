create extension if not exists pgcrypto;

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  round_date date not null unique,
  topic text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  round_date date not null,
  initial text not null,
  word text not null,
  student_number int not null,
  is_mvp boolean not null default false,
  created_at timestamptz not null default now(),

  constraint entries_round_date_fkey
    foreign key (round_date)
    references public.rounds(round_date)
    on delete cascade,

  constraint entries_initial_check
    check (initial in ('ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ')),

  constraint entries_student_number_check
    check (student_number between 1 and 23),

  constraint entries_word_not_blank_check
    check (length(trim(word)) > 0),

  constraint entries_word_length_check
    check (char_length(trim(word)) between 1 and 6),

  constraint entries_one_per_student_per_day_unique
    unique (round_date, student_number),

  constraint entries_one_per_initial_per_day_unique
    unique (round_date, initial)
);

create table if not exists public.teacher_sessions (
  token uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists entries_round_date_idx
  on public.entries(round_date);

create index if not exists entries_round_date_initial_idx
  on public.entries(round_date, initial);

create index if not exists entries_round_date_student_idx
  on public.entries(round_date, student_number);

create index if not exists teacher_sessions_expires_at_idx
  on public.teacher_sessions(expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rounds_set_updated_at on public.rounds;
create trigger rounds_set_updated_at
before update on public.rounds
for each row
execute function public.set_updated_at();

create or replace function public.ensure_round_for_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rounds (round_date, topic)
  values (new.round_date, '')
  on conflict (round_date) do nothing;
  return new;
end;
$$;

drop trigger if exists entries_ensure_round on public.entries;
create trigger entries_ensure_round
before insert on public.entries
for each row
execute function public.ensure_round_for_entry();

alter table public.rounds enable row level security;
alter table public.entries enable row level security;
alter table public.teacher_sessions enable row level security;

drop policy if exists "rounds are readable" on public.rounds;
create policy "rounds are readable"
on public.rounds
for select
to anon
using (true);

drop policy if exists "entries are readable" on public.entries;
create policy "entries are readable"
on public.entries
for select
to anon
using (true);

drop policy if exists "students can insert entries" on public.entries;
create policy "students can insert entries"
on public.entries
for insert
to anon
with check (
  student_number between 1 and 23
  and initial in ('ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ')
  and length(trim(word)) > 0
  and char_length(trim(word)) between 1 and 6
);

drop policy if exists "students can update entries" on public.entries;
create policy "students can update entries"
on public.entries
for update
to anon
using (student_number between 1 and 23)
with check (
  student_number between 1 and 23
  and initial in ('ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ')
  and length(trim(word)) > 0
  and char_length(trim(word)) between 1 and 6
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.rounds;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.entries;
  exception
    when duplicate_object then null;
  end;
end;
$$;

insert into public.rounds (round_date, topic)
values (((now() at time zone 'Asia/Seoul')::date), '')
on conflict (round_date) do nothing;
