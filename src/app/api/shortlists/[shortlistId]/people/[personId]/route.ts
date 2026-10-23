import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

async function checkOwnership(shortlistId: string, companyId: string) {
  const { data } = await admin
    .from("shortlists")
    .select("id")
    .eq("id", shortlistId)
    .eq("company_id", companyId)
    .single();
  return !!data;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shortlistId: string; personId: string }> }
) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { shortlistId, personId } = await params;
  if (!(await checkOwnership(shortlistId, auth.companyId))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Upsert (ignore duplicate)
  const { error } = await admin
    .from("shortlist_people")
    .upsert({ shortlist_id: shortlistId, person_id: personId });

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shortlistId: string; personId: string }> }
) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { shortlistId, personId } = await params;
  if (!(await checkOwnership(shortlistId, auth.companyId))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await admin
    .from("shortlist_people")
    .delete()
    .eq("shortlist_id", shortlistId)
    .eq("person_id", personId);

  return NextResponse.json({ ok: true });
}