
-- User profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default '',
  age int,
  grade text,
  location text,
  school text,
  subjects text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Race scores / leaderboard
create table public.race_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null default 'Racer',
  race_id text not null default 'free',
  score numeric not null default 0,
  distance numeric not null default 0,
  ghost_data jsonb,
  created_at timestamptz default now()
);

alter table public.race_scores enable row level security;
create policy "Anyone can read scores" on public.race_scores for select to anon, authenticated using (true);
create policy "Auth users can insert scores" on public.race_scores for insert to authenticated with check (auth.uid() = user_id);
create policy "Anon can insert scores" on public.race_scores for insert to anon with check (true);

-- Education progress
create table public.education_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  quizzes_completed int default 0,
  quizzes_correct int default 0,
  flashcards_reviewed int default 0,
  lessons_completed int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.education_progress enable row level security;
create policy "Users read own progress" on public.education_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on public.education_progress for insert with check (auth.uid() = user_id);
create policy "Users update own progress" on public.education_progress for update using (auth.uid() = user_id);

-- Friends / family links
create table public.friend_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

alter table public.friend_links enable row level security;
create policy "Users read own friends" on public.friend_links for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users add friends" on public.friend_links for insert with check (auth.uid() = user_id);

