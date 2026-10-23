alter table companies        enable row level security;
alter table profiles         enable row level security;
alter table candidates       enable row level security;
alter table shortlists       enable row level security;
alter table shortlist_people enable row level security;
alter table saved_briefs     enable row level security;
alter table searches         enable row level security;
alter table stripe_events    enable row level security;

create or replace function auth_company_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid()
$$;

create policy cand_read on candidates
  for select to authenticated using (true);

create policy prof_self on profiles
  for select to authenticated using (id = auth.uid());

create policy comp_read on companies
  for select to authenticated using (id = auth_company_id());

create policy sl_all on shortlists
  for all to authenticated
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create policy slp_all on shortlist_people
  for all to authenticated
  using (exists (
    select 1 from shortlists s
    where s.id = shortlist_id and s.company_id = auth_company_id()
  ))
  with check (exists (
    select 1 from shortlists s
    where s.id = shortlist_id and s.company_id = auth_company_id()
  ));

create policy sb_all on saved_briefs
  for all to authenticated
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create policy se_all on searches
  for all to authenticated
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());