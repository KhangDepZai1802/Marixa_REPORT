-- Run once in a NEW Supabase project's SQL Editor.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  department text not null check (char_length(department) between 1 and 80),
  role text not null check (role in ('admin','employee')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Only trusted app_metadata (written with the server key) grants roles.
-- Ordinary users cannot change app_metadata or write profiles directly.
create function public.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data->>'role' in ('admin','employee') then
    insert into public.profiles (id,full_name,department,role)
    values(new.id,new.raw_app_meta_data->>'full_name',new.raw_app_meta_data->>'department',new.raw_app_meta_data->>'role')
    on conflict(id) do update set full_name=excluded.full_name,department=excluded.department,role=excluded.role;
  end if;
  return new;
end; $$;
create trigger sync_auth_profile after insert or update of raw_app_meta_data on auth.users
for each row execute function public.sync_auth_profile();

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.sync_auth_profile() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select public.is_admin()));

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  morning_report_id uuid references public.reports(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  report_date date not null,
  type text not null check(type in ('morning','evening')),
  full_name text not null check(char_length(full_name) between 1 and 100),
  department text not null check(char_length(department) between 1 and 80),
  position text not null check(char_length(position) between 1 and 100),
  highlights jsonb not null check(jsonb_typeof(highlights)='array' and jsonb_array_length(highlights)=3),
  tasks jsonb not null check(jsonb_typeof(tasks)='array' and jsonb_array_length(tasks) between 1 and 20),
  kpi_label text not null default '' check(char_length(kpi_label)<=100),
  kpi_target numeric not null default 0 check(kpi_target between 0 and 1000000000),
  kpi_actual numeric not null default 0 check(kpi_actual between 0 and 1000000000),
  kpi_unit text not null default '' check(char_length(kpi_unit)<=30),
  notes text not null default '' check(char_length(notes)<=3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,report_date,type),
  unique(morning_report_id),
  check((type='morning' and morning_report_id is null) or (type='evening' and morning_report_id is not null)),
  check((kpi_target=0 and kpi_actual=0) or (kpi_target>0 and char_length(trim(kpi_label))>0))
);
create index reports_date_idx on public.reports(report_date desc);
create index reports_owner_idx on public.reports(user_id,report_date desc);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select,insert,update,delete on public.reports to authenticated;
grant select,insert,update,delete on public.reports to service_role;
create policy reports_read on public.reports for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy reports_insert on public.reports for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid())));
create policy reports_update on public.reports for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reports_delete on public.reports for delete to authenticated using(user_id=(select auth.uid()));

create function public.validate_report() returns trigger language plpgsql set search_path = '' as $$
declare item jsonb; p public.profiles; parent public.reports; any_highlight boolean := false;
begin
  -- FK cleanup must preserve reports when an employee is deleted.
  if tg_op='UPDATE' and new.user_id is null and old.user_id is not null and pg_trigger_depth()>1 then return new; end if;
  select * into p from public.profiles where id=new.user_id;
  if p.id is null then raise exception 'Unknown report owner'; end if;
  if new.type='evening' then
    select * into parent from public.reports where id=new.morning_report_id for share;
    if parent.id is null or parent.type<>'morning' or parent.user_id is distinct from new.user_id or parent.report_date<>new.report_date then
      raise exception 'Evening report must continue your morning report on the same date';
    end if;
  end if;
  if tg_op='INSERT' then
    new.full_name := p.full_name; new.department := p.department;
    new.created_at := now();
  else
    if new.report_date<>old.report_date or new.type<>old.type or new.morning_report_id is distinct from old.morning_report_id then raise exception 'Cannot change report date, type or source after saving'; end if;
    if new.user_id is distinct from old.user_id then raise exception 'Cannot change report owner'; end if;
    new.full_name := old.full_name; new.department := old.department; new.created_at := old.created_at;
  end if;
  for item in select value from jsonb_array_elements(new.highlights) loop
    if jsonb_typeof(item)<>'string' or char_length(item #>> '{}')>300 then raise exception 'Invalid highlight'; end if;
    if char_length(trim(item #>> '{}'))>0 then any_highlight := true; end if;
  end loop;
  if not any_highlight then raise exception 'At least one highlight required'; end if;
  for item in select value from jsonb_array_elements(new.tasks) loop
    if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'title') is distinct from 'string'
      or char_length(trim(item->>'title')) not between 1 and 500
      or jsonb_typeof(item->'progress') is distinct from 'number'
      or (item->>'progress')::numeric not between 0 and 100
      or jsonb_typeof(item->'result') is distinct from 'string'
      or char_length(item->>'result')>500 then raise exception 'Invalid task'; end if;
  end loop;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.validate_report() from public;
create trigger validate_report before insert or update on public.reports for each row execute function public.validate_report();
commit;
