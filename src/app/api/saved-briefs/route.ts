import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { data } = await admin
    .from("saved_briefs")
    .select("*")
    .eq("company_id", auth.companyId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ saved_briefs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const brief = body?.brief;
  const filters = body?.filters;

  if (typeof brief !== "string" || !brief.trim()) {
    return NextResponse.json({ error: "brief required" }, { status: 400 });
  }
  if (!filters || typeof filters !== "object") {
    return NextResponse.json({ error: "filters required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("saved_briefs")
    .insert({
      company_id: auth.companyId,
      brief: brief.trim().slice(0, 500),
      filters,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ id: data.id });
}