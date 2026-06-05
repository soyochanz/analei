create table if not exists public.cash_register_closures (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('cash', 'card', 'all')),
  from_at timestamptz not null,
  to_at timestamptz not null default now(),
  total_cents integer not null default 0,
  sale_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cash_register_closures enable row level security;

-- Register closure writes happen through Edge Functions using the service role.
