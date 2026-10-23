create extension if not exists "pg_trgm";

create table companies (
  id text primary key,
  name text not null,
  plan text not null default 'free' check (plan in ('free','paid')),
  searches_used int not null default 0,
  plan_state_at timestamptz not null default '1970-01-01'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id text not null references companies(id),
  email text not null
);

create table candidates (
  id text primary key,
  full_name text not null,
  avatar_url text,
  headline text not null,
  current_title text,
  current_company text,
  current_company_logo_url text,
  role text not null,
  seniority text not null,
  years_experience int not null,
  location_city text not null default '',
  location_state text,
  location_country text,
  open_to_work boolean not null default false,
  skills text[] not null default '{}',
  skills_lc text[] not null default '{}',
  worked_at_startup boolean not null default false,
  worked_at_companies text[] not null default '{}',
  studied_at_schools text[] not null default '{}',
  degrees text[] not null default '{}',
  experiences jsonb not null default '[]',
  education jsonb not null default '[]'
);

create index cand_role on candidates (role);
create index cand_seniority on candidates (seniority);
create index cand_city_trgm on candidates using gin (location_city gin_trgm_ops);
create index cand_skills_lc_gin on candidates using gin (skills_lc);
create index cand_degrees_gin on candidates using gin (degrees);
create index cand_schools_gin on candidates using gin (studied_at_schools);

create table shortlists (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table shortlist_people (
  shortlist_id uuid references shortlists(id) on delete cascade,
  person_id text references candidates(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (shortlist_id, person_id)
);

create table saved_briefs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  brief text not null,
  filters jsonb not null,
  created_at timestamptz not null default now()
);

create table searches (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  brief text not null,
  filters jsonb not null,
  result_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table stripe_events (
  event_id text primary key,
  event_created bigint not null,
  event_type text,
  company_id text,
  received_at timestamptz not null default now()
);