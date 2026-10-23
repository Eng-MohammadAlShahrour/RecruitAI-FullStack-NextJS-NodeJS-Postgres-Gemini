-- Allow 2 free searches per company instead of 1.
-- Replaces consume_search from 0004_fix_plan.sql

drop function if exists consume_search(text);

create or replace function consume_search(p_company text)
returns table(ok boolean, remaining int, plan_name text)
language plpgsql
as $$
declare
  v_plan text;
  v_used int;
begin
  update companies
     set searches_used = searches_used + 1
   where id = p_company
     and (companies.plan = 'paid' or companies.searches_used < 2)   -- ⬅️ 2 بدل 1
  returning companies.plan, companies.searches_used into v_plan, v_used;

  if not found then
    select c.plan, c.searches_used into v_plan, v_used
    from companies c where c.id = p_company;
    return query
      select false,
             case when v_plan = 'paid' then null::int
                  else greatest(0, 2 - v_used) end,                  -- ⬅️ 2
             v_plan;
    return;
  end if;

  return query
    select true,
           case when v_plan = 'paid' then null::int
                else greatest(0, 2 - v_used) end,                    -- ⬅️ 2
           v_plan;
end $$;