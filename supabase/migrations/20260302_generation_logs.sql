create table public.generation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  model text not null,
  subject text,
  curriculum text,
  grade text,
  language text,
  questions_requested int,
  questions_returned int,
  success boolean not null default true,
  error_message text,
  prompt_tokens int,
  output_tokens int,
  total_tokens int,
  google_search_used boolean default false,
  created_at timestamptz default now()
);

alter table public.generation_logs enable row level security;
create policy "Users can read own logs" on public.generation_logs for select using (auth.uid() = user_id);
create policy "Service can insert logs" on public.generation_logs for insert with check (auth.uid() = user_id);
