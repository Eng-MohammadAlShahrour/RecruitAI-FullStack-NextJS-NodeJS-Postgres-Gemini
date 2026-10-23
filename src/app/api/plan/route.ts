import { NextRequest, NextResponse } from "next/server";
import { requireRecruiter } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await requireRecruiter(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { data, error } = await admin
    .from("companies")
    .select("plan, searches_used")
    .eq("id", auth.companyId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const remaining =
    data.plan === "paid" ? null : Math.max(0, 2 - data.searches_used);

  return NextResponse.json({
    plan: data.plan,
    searches_remaining: remaining,
  });
}