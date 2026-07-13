create extension if not exists pgcrypto;

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  round_date date not null unique,
  topic text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  round_date date not null,
  initial text not null,
  word text not null,
  student_number int not null,
  is_mvp boolean not null default false,
  created_at timestamptz not null default now(),

  constraint entries_round_date_fkey
    foreign key (round_date)
    references rounds(round_date)
    on delete cascade,

  constraint entries_initial_check
    check (initial in ('ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ')),

  constraint entries_student_number_check
    check (student_number between 1 and 23),

  constraint entries_word_not_blank_check
    check (length(trim(word)) > 0),

  constraint entries_word_length_check
    check (char_length(trim(word)) between 1 and 8),

  constraint entries_one_per_student_per_day_unique
    unique (round_date, student_number),

  constraint entries_one_per_initial_per_day_unique
    unique (round_date, initial)
);

create table if not exists teacher_sessions (
  token uuid primary key default gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists word_quizzes (
  round_date date primary key,
  initial text not null,
  answer text not null,
  meaning text not null,
  example_sentence text not null default '',
  updated_at timestamptz not null default now(),

  constraint word_quizzes_round_date_fkey
    foreign key (round_date)
    references rounds(round_date)
    on delete cascade,

  constraint word_quizzes_initial_check
    check (initial in ('ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ')),

  constraint word_quizzes_answer_not_blank_check
    check (length(trim(answer)) > 0),

  constraint word_quizzes_meaning_not_blank_check
    check (length(trim(meaning)) > 0)
);

alter table word_quizzes
  add column if not exists example_sentence text not null default '';

create table if not exists word_quiz_solvers (
  round_date date not null,
  student_number integer not null,
  solved_at timestamptz not null default now(),

  constraint word_quiz_solvers_pkey
    primary key (round_date, student_number),

  constraint word_quiz_solvers_round_date_fkey
    foreign key (round_date)
    references rounds(round_date)
    on delete cascade,

  constraint word_quiz_solvers_student_number_check
    check (student_number between 1 and 23)
);

create table if not exists student_mission_events (
  id uuid primary key default gen_random_uuid(),
  student_number integer not null,
  event_date date not null,
  event_type text not null,
  created_at timestamptz not null default now(),

  constraint student_mission_events_student_check
    check (student_number between 1 and 23),

  constraint student_mission_events_type_check
    check (event_type in ('word_entry', 'quiz_correct')),

  constraint student_mission_events_unique
    unique (student_number, event_date, event_type)
);

create index if not exists entries_round_date_idx
  on entries(round_date);

create index if not exists entries_round_date_initial_idx
  on entries(round_date, initial);

create index if not exists entries_round_date_student_idx
  on entries(round_date, student_number);

create index if not exists teacher_sessions_expires_at_idx
  on teacher_sessions(expires_at);

create index if not exists word_quizzes_updated_at_idx
  on word_quizzes(updated_at);

create index if not exists word_quiz_solvers_round_date_idx
  on word_quiz_solvers(round_date);

create index if not exists student_mission_events_student_date_idx
  on student_mission_events(student_number, event_date);

create index if not exists student_mission_events_student_type_date_idx
  on student_mission_events(student_number, event_type, event_date);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rounds_set_updated_at on rounds;
create trigger rounds_set_updated_at
before update on rounds
for each row
execute function set_updated_at();

drop trigger if exists word_quizzes_set_updated_at on word_quizzes;
create trigger word_quizzes_set_updated_at
before update on word_quizzes
for each row
execute function set_updated_at();

create or replace function ensure_round_for_entry()
returns trigger
language plpgsql
as $$
begin
  insert into rounds (round_date, topic)
  values (new.round_date, '')
  on conflict (round_date) do nothing;
  return new;
end;
$$;

drop trigger if exists entries_ensure_round on entries;
create trigger entries_ensure_round
before insert on entries
for each row
execute function ensure_round_for_entry();

insert into rounds (round_date, topic)
values (((now() at time zone 'Asia/Seoul')::date), '')
on conflict (round_date) do nothing;
