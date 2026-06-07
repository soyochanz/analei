alter table public.products
add column if not exists is_featured boolean not null default false;

alter table public.salon_settings
add column if not exists opening_time text default '09:00',
add column if not exists closing_time text default '20:30';

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Consejos',
  read_time text not null default '3 min',
  summary text not null default '',
  content_html text not null default '',
  cover_image_url text,
  is_published boolean not null default true,
  published_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'home',
  created_at timestamptz not null default now()
);

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts for select
to anon, authenticated
using (is_published = true);

-- Writes are handled through Edge Functions using the service role.
drop policy if exists "No direct subscriber access" on public.newsletter_subscribers;
