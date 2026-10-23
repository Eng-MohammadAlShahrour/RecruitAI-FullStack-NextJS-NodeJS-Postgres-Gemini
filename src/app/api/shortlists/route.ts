import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { data } = await admin
    .from("shortlists")
    .select("id, name, created_at, shortlist_people(person_id)")
    .eq("company_id", auth.companyId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ shortlists: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("shortlists")
    .insert({ company_id: auth.companyId, name: name.trim().slice(0, 100) })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ id: data.id });
}