-- Replace search_candidates to support `locations: string[]` (OR semantics)
-- and also keep backward compat for legacy `location: string`.

create or replace function search_candidates(f jsonb)
returns table(id text, score numeric)
language sql
stable
as $$
  with scored as (
    select
      c.id,
      (
        coalesce(cardinality(array(
          select unnest(c.skills_lc)
          intersect
          select lower(x)
            from jsonb_array_elements_text(coalesce(f->'skills','[]'::jsonb)) x
        )), 0) * 3
        + case when f ? 'role' and c.role = f->>'role' then 4 else 0 end
        + case when f ? 'studied_at' and exists (
            select 1 from unnest(c.studied_at_schools) s
            where s ilike '%' || (f->>'studied_at') || '%'
          ) then 4 else 0 end
        + case when f ? 'worked_at_startup' and c.worked_at_startup then 3 else 0 end
        + case when f ? 'open_to_work' and c.open_to_work then 2 else 0 end
        - abs(c.years_experience - coalesce((f->>'min_years')::int, c.years_experience)) * 0.05
      )::numeric as score
    from candidates c
    where
      (not f ? 'role'      or c.role = f->>'role')
      and (not f ? 'seniority' or c.seniority = f->>'seniority')
      -- LOCATIONS: OR across all cities in the array
      and (
        not f ? 'locations'
        or exists (
          select 1 from jsonb_array_elements_text(f->'locations') l
          where c.location_city ilike '%' || l || '%'
        )
      )
      -- BACKWARD COMPAT: legacy single `location`
      and (
        not f ? 'location'
        or c.location_city ilike '%' || (f->>'location') || '%'
      )
      and (not f ? 'min_years' or c.years_experience >= (f->>'min_years')::int)
      and (not f ? 'max_years' or c.years_experience <= (f->>'max_years')::int)
      and (not f ? 'open_to_work' or c.open_to_work = (f->>'open_to_work')::boolean)
      and (not f ? 'worked_at_startup' or c.worked_at_startup = (f->>'worked_at_startup')::boolean)
      and (
        not f ? 'skills'
        or c.skills_lc @> array(
             select lower(x) from jsonb_array_elements_text(f->'skills') x
           )
      )
      and (not f ? 'studied_at' or exists (
            select 1 from unnest(c.studied_at_schools) s
            where s ilike '%' || (f->>'studied_at') || '%'))
      and (not f ? 'degree' or exists (
            select 1 from unnest(c.degrees) d
            where d = lower(f->>'degree')))
      and (not f ? 'worked_at' or c.worked_at_companies && array(
            select lower(x) from jsonb_array_elements_text(f->'worked_at') x
          ))
  )
  select id, score from scored order by score desc, id asc;
$$;