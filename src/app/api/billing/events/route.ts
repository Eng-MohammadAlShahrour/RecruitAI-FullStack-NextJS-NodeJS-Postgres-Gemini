import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/admin";
import { verifyStripe, planForEvent, type StripeEvent } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "no secret" }, { status: 500 });
  }

  if (!verifyStripe(raw, sig, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const company = event.data?.object?.metadata?.company;
  if (!company) {
    return NextResponse.json({ ok: true });
  }

  // Idempotency: insert event, fail if already seen
  const { error: dupErr } = await admin.from("stripe_events").insert({
    event_id: event.id,
    event_created: event.created,
    event_type: event.type,
    company_id: company,
  });

  if (dupErr?.code === "23505") {
    return NextResponse.json({ ok: true });
  }

  // Check ordering
  const { data: comp } = await admin
    .from("companies")
    .select("plan_state_at")
    .eq("id", company)
    .single();

  if (comp) {
    const eventTime = new Date(event.created * 1000).getTime();
    const lastTime = new Date(comp.plan_state_at).getTime();
    if (eventTime <= lastTime) {
      return NextResponse.json({ ok: true });
    }
  }

  const newPlan = planForEvent(event);

  if (newPlan) {
    await admin
      .from("companies")
      .update({
        plan: newPlan,
        plan_state_at: new Date(event.created * 1000).toISOString(),
      })
      .eq("id", company);
  }

  return NextResponse.json({ ok: true });
}