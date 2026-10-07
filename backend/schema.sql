-- Only the HBCPPA API's server credentials may access these records.
create table if not exists public.hbcppa_content (
  key text primary key check (key in ('fixtures', 'news')),
  value jsonb not null check (jsonb_typeof(value) = 'array'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.hbcppa_admin_auth (
  id boolean primary key default true check (id),
  password_hash text not null,
  salt text not null,
  iterations integer not null check (iterations >= 200000)
);
create table if not exists public.hbcppa_admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);
create table if not exists public.hbcppa_login_attempts (
  bucket text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.hbcppa_content enable row level security;
alter table public.hbcppa_admin_auth enable row level security;
alter table public.hbcppa_admin_sessions enable row level security;
alter table public.hbcppa_login_attempts enable row level security;
revoke all on public.hbcppa_content, public.hbcppa_admin_auth, public.hbcppa_admin_sessions, public.hbcppa_login_attempts from public, anon, authenticated;
grant all on public.hbcppa_content, public.hbcppa_admin_auth, public.hbcppa_admin_sessions, public.hbcppa_login_attempts to service_role;

create or replace function public.hbcppa_take_login_attempt(p_bucket text)
returns integer language plpgsql security invoker set search_path = '' as $$
declare result integer;
begin
  insert into public.hbcppa_login_attempts as attempt (bucket, window_start, attempts)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    attempts = case when attempt.window_start < now() - interval '15 minutes' then 1 else attempt.attempts + 1 end,
    window_start = case when attempt.window_start < now() - interval '15 minutes' then now() else attempt.window_start end
  returning attempts into result;
  return result;
end;
$$;
revoke all on function public.hbcppa_take_login_attempt(text) from public, anon, authenticated;
grant execute on function public.hbcppa_take_login_attempt(text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hbcppa-news', 'hbcppa-news', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
