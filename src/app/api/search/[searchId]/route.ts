import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchId } = await params;
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  // RLS ensures we only see our company's search
  const { data: search, error } = await admin
    .from("searches")
    .select("id, company_id, result_ids, filters, brief")
    .eq("id", searchId)
    .eq("company_id", auth.companyId)
    .single();

  if (error || !search) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ids: string[] = search.result_ids ?? [];
  const from = (page - 1) * 20;
  const slice = ids.slice(from, from + 20);

  const { data: people } = await admin
    .from("candidates")
    .select("id, full_name, avatar_url, headline, current_title, current_company, current_company_logo_url, role, seniority, years_experience, location_city, location_state, open_to_work, skills")
    .in("id", slice);

  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const results = slice.map((id) => byId.get(id)).filter(Boolean);

  return NextResponse.json({
    search_id: search.id,
    brief: search.brief,
    filters: search.filters,
    total: ids.length,
    page,
    per_page: 20,
    results,
  });
}