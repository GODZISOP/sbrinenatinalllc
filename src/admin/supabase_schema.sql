-- ============================================================================
-- Multi-Website Centralized CMS & Admin Panel Schema (Supabase / PostgreSQL)
-- Run this script once in your Supabase Project -> SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Websites Table (1 row per managed website)
create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  domain text unique,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  client_email text,
  client_access_code text,
  owner_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_websites_slug on public.websites (slug);
create index if not exists idx_websites_domain on public.websites (domain);

-- 2. Admin Users Table (Super Admin & Per-Website Client Accounts)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('super_admin', 'client')),
  assigned_slug text references public.websites(slug) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_users_email on public.admin_users (email);

-- Auto-update updated_at timestamp
create or replace function public.set_websites_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_websites_updated_at on public.websites;
create trigger trg_websites_updated_at
  before update on public.websites
  for each row
  execute function public.set_websites_updated_at();

-- 3. Row Level Security (RLS)
alter table public.websites enable row level security;
alter table public.admin_users enable row level security;

-- Storefront visitors can read public website configurations
drop policy if exists "Public storefront read websites" on public.websites;
create policy "Public storefront read websites"
  on public.websites
  for select
  using (true);

-- Authenticated Supabase Auth owners or super_admins can write directly
drop policy if exists "Authenticated owner write websites" on public.websites;
create policy "Authenticated owner write websites"
  on public.websites
  for all
  to authenticated
  using (
    auth.uid() = owner_user_id
    or exists (
      select 1 from public.admin_users u
      where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and u.role = 'super_admin'
    )
  )
  with check (
    auth.uid() = owner_user_id
    or exists (
      select 1 from public.admin_users u
      where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and u.role = 'super_admin'
    )
  );

-- Authenticated users can read only their own admin_users record (super_admin reads all)
drop policy if exists "Authenticated admin_users read" on public.admin_users;
create policy "Authenticated admin_users read"
  on public.admin_users
  for select
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1 from public.admin_users u
      where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and u.role = 'super_admin'
    )
  );

-- 4. Secure RPC Helpers (Verified against admin_users inside Postgres)
-- Allows the browser Admin Panel to authenticate and perform role-checked writes
-- via the Supabase anon key without exposing password hashes publicly.

create or replace function public.cms_bootstrap_super_admin(
  p_email text,
  p_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_clean_email text := lower(trim(p_email));
begin
  if exists (
    select 1 from public.admin_users
    where role = 'super_admin' and lower(email) = 'admin@mmshahfaisalllc.com'
  ) and v_clean_email <> 'admin@mmshahfaisalllc.com' then
    update public.admin_users
    set email = v_clean_email,
        password_hash = p_password_hash
    where role = 'super_admin' and lower(email) = 'admin@mmshahfaisalllc.com';
    return jsonb_build_object('bootstrapped', true, 'migrated', true);
  end if;

  select count(*) into v_count from public.admin_users where role = 'super_admin';
  if v_count = 0 then
    insert into public.admin_users (email, password_hash, role, assigned_slug)
    values (v_clean_email, p_password_hash, 'super_admin', null)
    on conflict (email) do nothing;
    return jsonb_build_object('bootstrapped', true);
  end if;
  return jsonb_build_object('bootstrapped', false);
end;
$$;

create or replace function public.cms_login(
  p_email text,
  p_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  select id, email, role, assigned_slug
  into v_user
  from public.admin_users
  where lower(email) = lower(trim(p_email))
    and password_hash = p_password_hash
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid email or password');
  end if;

  return jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'role', v_user.role,
      'assignedSlug', v_user.assigned_slug
    )
  );
end;
$$;

create or replace function public.cms_upsert_website(
  p_actor_email text,
  p_actor_password_hash text,
  p_slug text,
  p_domain text,
  p_name text,
  p_config jsonb,
  p_client_email text default null,
  p_client_access_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_clean_slug text := lower(trim(p_slug));
  v_clean_domain text := nullif(lower(trim(coalesce(p_domain, ''))), '');
  v_clean_client_email text := nullif(lower(trim(coalesce(p_client_email, ''))), '');
begin
  select * into v_actor
  from public.admin_users
  where lower(email) = lower(trim(p_actor_email))
    and password_hash = p_actor_password_hash
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized');
  end if;

  if v_actor.role = 'client' and v_actor.assigned_slug is distinct from v_clean_slug then
    return jsonb_build_object('ok', false, 'error', 'Forbidden: You can only edit your assigned website');
  end if;

  insert into public.websites (
    slug, domain, name, config, client_email, client_access_code, updated_at
  )
  values (
    v_clean_slug,
    v_clean_domain,
    coalesce(nullif(trim(p_name), ''), v_clean_slug),
    coalesce(p_config, '{}'::jsonb),
    case when v_actor.role = 'super_admin' then v_clean_client_email else null end,
    case when v_actor.role = 'super_admin' then p_client_access_code else null end,
    now()
  )
  on conflict (slug) do update set
    domain = case when v_actor.role = 'super_admin' then excluded.domain else public.websites.domain end,
    name = excluded.name,
    config = excluded.config,
    client_email = case when v_actor.role = 'super_admin' and p_client_email is not null then v_clean_client_email else public.websites.client_email end,
    client_access_code = case when v_actor.role = 'super_admin' and p_client_access_code is not null then p_client_access_code else public.websites.client_access_code end,
    updated_at = now();

  return jsonb_build_object('ok', true, 'slug', v_clean_slug);
end;
$$;

create or replace function public.cms_delete_website(
  p_actor_email text,
  p_actor_password_hash text,
  p_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
begin
  select * into v_actor
  from public.admin_users
  where lower(email) = lower(trim(p_actor_email))
    and password_hash = p_actor_password_hash
    and role = 'super_admin'
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Super Admin authorization required');
  end if;

  delete from public.websites where slug = lower(trim(p_slug));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.cms_set_client_access(
  p_actor_email text,
  p_actor_password_hash text,
  p_slug text,
  p_client_email text,
  p_client_password_hash text,
  p_client_access_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor record;
  v_clean_slug text := lower(trim(p_slug));
  v_clean_email text := lower(trim(p_client_email));
begin
  select * into v_actor
  from public.admin_users
  where lower(email) = lower(trim(p_actor_email))
    and password_hash = p_actor_password_hash
    and role = 'super_admin'
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Super Admin authorization required');
  end if;

  update public.websites
  set client_email = v_clean_email,
      client_access_code = p_client_access_code,
      updated_at = now()
  where slug = v_clean_slug;

  delete from public.admin_users
  where role = 'client' and assigned_slug = v_clean_slug;

  insert into public.admin_users (email, password_hash, role, assigned_slug)
  values (v_clean_email, p_client_password_hash, 'client', v_clean_slug)
  on conflict (email) do update set
    password_hash = excluded.password_hash,
    role = 'client',
    assigned_slug = v_clean_slug;

  return jsonb_build_object('ok', true, 'slug', v_clean_slug, 'clientEmail', v_clean_email);
end;
$$;

create or replace function public.cms_update_super_admin_password(
  p_actor_email text,
  p_old_password_hash text,
  p_new_password_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update public.admin_users
  set password_hash = p_new_password_hash
  where lower(email) = lower(trim(p_actor_email))
    and password_hash = p_old_password_hash
    and role = 'super_admin';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'Current credentials do not match');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cms_bootstrap_super_admin(text, text) to anon, authenticated;
grant execute on function public.cms_login(text, text) to anon, authenticated;
grant execute on function public.cms_upsert_website(text, text, text, text, text, jsonb, text, text) to anon, authenticated;
grant execute on function public.cms_delete_website(text, text, text) to anon, authenticated;
grant execute on function public.cms_set_client_access(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.cms_update_super_admin_password(text, text, text) to anon, authenticated;

