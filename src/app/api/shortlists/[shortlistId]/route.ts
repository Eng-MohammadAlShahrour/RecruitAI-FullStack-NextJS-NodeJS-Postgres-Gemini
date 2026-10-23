import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shortlistId: string }> }
) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { shortlistId } = await params;
  const body = await req.json().catch(() => null);
  const name = body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const { error } = await admin
    .from("shortlists")
    .update({ name: name.trim().slice(0, 100) })
    .eq("id", shortlistId)
    .eq("company_id", auth.companyId);

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shortlistId: string }> }
) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { shortlistId } = await params;

  const { error } = await admin
    .from("shortlists")
    .delete()
    .eq("id", shortlistId)
    .eq("company_id", auth.companyId);

  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}