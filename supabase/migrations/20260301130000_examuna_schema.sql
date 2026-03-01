create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default auth.uid(),
  email text unique,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text,
  ib_level text,
  language text default 'en',
  grading_scale text,
  exam_format text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.source_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  status text default 'uploaded',
  created_at timestamptz default now()
);

create table if not exists public.question_bank (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_file_id uuid references public.source_files(id) on delete set null,
  question_text text not null,
  answer_key text,
  topic text,
  difficulty text,
  ib_band int,
  cognitive_level text,
  marks int default 0,
  language text default 'en',
  usage_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  subject text,
  language text default 'en',
  duration_minutes int,
  total_marks int,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid references public.question_bank(id) on delete set null,
  custom_question_text text,
  position int,
  marks int,
  action_state text default 'keep',
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.source_files enable row level security;
alter table public.question_bank enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;

create policy "Users can read own users row" on public.users for select using (auth.uid() = id);
create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id);
create policy "Users can manage own source files" on public.source_files for all using (auth.uid() = user_id);
create policy "Users can manage own questions" on public.question_bank for all using (auth.uid() = user_id);
create policy "Users can manage own exams" on public.exams for all using (auth.uid() = user_id);
create policy "Users can manage own exam questions" on public.exam_questions for all using (
  exists (select 1 from public.exams e where e.id = exam_id and e.user_id = auth.uid())
);
