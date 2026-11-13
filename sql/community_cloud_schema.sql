-- ============================================================================
-- SCHEMA ĐÁM MÂY SUPABASE CHO CỘNG ĐỒNG ĐẤT PHÚ (CHẠY 1 LẦN TRONG SQL EDITOR)
-- ============================================================================

create table if not exists public.community_users (
  id text primary key,
  name text not null,
  account text unique not null,
  role text not null default 'member' check (role in ('guest', 'member', 'admin')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id text primary key,
  media_type text not null default 'photo' check (media_type in ('photo', 'video', 'youtube')),
  title text not null,
  district text not null default 'Đạo Tràng / Bà Con',
  category text not null default 'Tâm Linh & Hiếu Hạnh',
  poem text default '',
  intro text default '',
  img text default '',
  youtube_id text default '',
  video_src text default '',
  duration text default '',
  owner_id text not null default 'guest',
  owner_name text not null default 'Khách',
  owner_role text not null default 'guest',
  status text not null default 'published' check (status in ('published', 'pinned', 'archived')),
  likes integer not null default 0,
  comments jsonb not null default '[]'::jsonb,
  is_user_upload boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_posts_feed
  on public.community_posts (status, created_at desc);

-- Bật RLS nhưng mở quyền đọc/ghi qua API server (hoặc dùng SUPABASE_SERVICE_ROLE_KEY)
alter table public.community_users enable row level security;
alter table public.community_posts enable row level security;

drop policy if exists "Allow public read posts" on public.community_posts;
create policy "Allow public read posts" on public.community_posts
  for select using (status <> 'archived');

drop policy if exists "Allow service write posts" on public.community_posts;
create policy "Allow service write posts" on public.community_posts
  for all using (true) with check (true);

drop policy if exists "Allow service access users" on public.community_users;
create policy "Allow service access users" on public.community_users
  for all using (true) with check (true);
