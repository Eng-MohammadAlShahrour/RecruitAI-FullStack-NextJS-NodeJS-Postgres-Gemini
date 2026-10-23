import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { briefToFilters } from "@/lib/search/llm";
import { sanitize, isEmpty } from "@/lib/search/filters";

export async function POST(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const brief = body?.brief;
  if (typeof brief !== "string" || !brief.trim()) {
    return NextResponse.json({ error: "brief required" }, { status: 400 });
  }

  let filters;
  try {
    const raw = await briefToFilters(brief);
    filters = sanitize(raw);
  } catch (e) {
    console.error("LLM error", e);
    return NextResponse.json({ error: "could not parse brief" }, { status: 422 });
  }

  const { data: planRows, error: planErr } = await admin.rpc("consume_search", {
    p_company: auth.companyId,
  });
  if (planErr) {
    console.error(planErr);
    return NextResponse.json({ error: "plan error" }, { status: 500 });
  }
  const row = planRows?.[0];
  if (!row?.ok) {
    return NextResponse.json(
      { error: "no searches left", plan: row?.plan },
      { status: 402 }
    );
  }

  if (isEmpty(filters)) {
    const { data: search } = await admin
      .from("searches")
      .insert({
        company_id: auth.companyId,
        brief,
        filters: {},
        result_ids: [],
      })
      .select("id")
      .single();

    return NextResponse.json({
      search_id: search!.id,
      filters: {},
      total: 0,
      results: [],
      searches_remaining: row.remaining,
    });
  }

  const { data: hits, error: searchErr } = await admin.rpc("search_candidates", {
    f: filters,
  });
  if (searchErr) {
    console.error(searchErr);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }

  const ids = (hits ?? []).map((h: { id: string }) => h.id);

  const { data: search } = await admin
    .from("searches")
    .insert({
      company_id: auth.companyId,
      brief,
      filters,
      result_ids: ids,
    })
    .select("id")
    .single();

  const page = ids.slice(0, 20);
  const { data: people } = await admin
    .from("candidates")
    .select("id, full_name, avatar_url, headline, current_title, current_company, current_company_logo_url, role, seniority, years_experience, location_city, location_state, open_to_work, skills")
    .in("id", page);

  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const results = page.map((id: string) => byId.get(id)).filter(Boolean);

  return NextResponse.json({
    search_id: search!.id,
    filters,
    total: ids.length,
    results,
    searches_remaining: row.remaining,
  });
}