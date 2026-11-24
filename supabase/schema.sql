-- LED-PI Supabase schema (PostgreSQL)
-- Run once in Supabase SQL Editor. Never expose the service_role key in browser code.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'analyst' check (role in ('owner','admin','analyst','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'analyst' check (role in ('admin','analyst','viewer')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,email)
);
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  asset_code text,
  title text not null,
  asset_type text not null default 'ไม่ระบุ',
  province text,
  district text,
  government_assessed numeric(16,2) check (government_assessed is null or government_assessed >= 0),
  listing_asking numeric(16,2) check (listing_asking is null or listing_asking >= 0),
  verified_transaction numeric(16,2) check (verified_transaction is null or verified_transaction >= 0),
  auction_date date,
  status text not null default 'watchlist' check (status in ('watchlist','reviewing','passed','won')),
  source_url text,
  source_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_org_created_idx on public.properties(organization_id,created_at desc);
create index if not exists properties_org_province_idx on public.properties(organization_id,province);
create index if not exists properties_org_status_idx on public.properties(organization_id,status);

create or replace function public.is_workspace_member(target_org uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=auth.uid()) $$;
create or replace function public.has_workspace_role(target_org uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=auth.uid() and m.role=any(allowed_roles)) $$;

create or replace function public.create_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare new_org uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.profiles(id,email) values(auth.uid(),(select email from auth.users where id=auth.uid()))
 on conflict(id) do update set email=excluded.email;
 insert into public.organizations(name,created_by) values(coalesce(nullif(trim(workspace_name),''),'My LED-PI Workspace'),auth.uid()) returning id into new_org;
 insert into public.organization_members(organization_id,user_id,role) values(new_org,auth.uid(),'owner');
 return new_org;
end; $$;

create or replace function public.invite_workspace_member(target_email text,target_role text,workspace_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare normalized_email text;
begin
 normalized_email=lower(trim(target_email));
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not public.has_workspace_role(workspace_id,array['owner','admin']) then raise exception 'Insufficient permission'; end if;
 if target_role not in ('admin','analyst','viewer') then raise exception 'Invalid role'; end if;
 insert into public.workspace_invitations(organization_id,email,role,invited_by)
 values(workspace_id,normalized_email,target_role,auth.uid())
 on conflict(organization_id,email) do update set role=excluded.role,invited_by=excluded.invited_by,created_at=now();
 -- If the invited user already has an account, add them immediately.
 insert into public.organization_members(organization_id,user_id,role)
 select workspace_id,u.id,target_role from auth.users u where lower(u.email)=normalized_email
 on conflict(organization_id,user_id) do update set role=excluded.role;
end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 insert into public.profiles(id,email) values(new.id,new.email) on conflict(id) do update set email=excluded.email;
 insert into public.organization_members(organization_id,user_id,role)
 select i.organization_id,new.id,i.role from public.workspace_invitations i where lower(i.email)=lower(new.email)
 on conflict(organization_id,user_id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created_ledpi on auth.users;
create trigger on_auth_user_created_ledpi after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.properties enable row level security;

drop policy if exists "profile self read" on public.profiles;
create policy "profile self or shared workspace read" on public.profiles for select to authenticated using (
 id=auth.uid() or exists(select 1 from public.organization_members mine join public.organization_members theirs on mine.organization_id=theirs.organization_id where mine.user_id=auth.uid() and theirs.user_id=profiles.id)
);
drop policy if exists "profile self insert" on public.profiles;
create policy "profile self insert" on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists "members read own workspaces" on public.organization_members;
create policy "members read own workspaces" on public.organization_members for select to authenticated using(public.is_workspace_member(organization_id));
drop policy if exists "org member read" on public.organizations;
create policy "org member read" on public.organizations for select to authenticated using(public.is_workspace_member(id));
drop policy if exists "org owner update" on public.organizations;
create policy "org owner update" on public.organizations for update to authenticated using(public.has_workspace_role(id,array['owner','admin'])) with check(public.has_workspace_role(id,array['owner','admin']));
drop policy if exists "invitations admin read" on public.workspace_invitations;
create policy "invitations admin read" on public.workspace_invitations for select to authenticated using(public.has_workspace_role(organization_id,array['owner','admin']));
drop policy if exists "properties member read" on public.properties;
create policy "properties member read" on public.properties for select to authenticated using(public.is_workspace_member(organization_id));
drop policy if exists "properties analyst write" on public.properties;
create policy "properties analyst write" on public.properties for insert to authenticated with check(public.has_workspace_role(organization_id,array['owner','admin','analyst']) and created_by=auth.uid());
drop policy if exists "properties analyst update" on public.properties;
create policy "properties analyst update" on public.properties for update to authenticated using(public.has_workspace_role(organization_id,array['owner','admin','analyst'])) with check(public.has_workspace_role(organization_id,array['owner','admin','analyst']));
drop policy if exists "properties admin delete" on public.properties;
create policy "properties admin delete" on public.properties for delete to authenticated using(public.has_workspace_role(organization_id,array['owner','admin']));

-- Restrict Data API access to authenticated users; RLS then scopes rows by workspace.
revoke all on table public.profiles, public.organizations, public.organization_members, public.workspace_invitations, public.properties from anon;
revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.has_workspace_role(uuid,text[]) from public, anon;
revoke all on function public.create_workspace(text) from public, anon;
revoke all on function public.invite_workspace_member(text,text,uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid,text[]) to authenticated;
grant usage on schema public to authenticated;
grant select,insert,update on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant update(name) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.workspace_invitations to authenticated;
grant select,insert,update,delete on public.properties to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.invite_workspace_member(text,text,uuid) to authenticated;
