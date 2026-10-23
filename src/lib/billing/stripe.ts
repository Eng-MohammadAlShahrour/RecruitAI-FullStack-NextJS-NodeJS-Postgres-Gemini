import crypto from "crypto";

export function verifyStripe(
  body: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["t"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(ts + "." + body)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type StripeEvent = {
  id: string;
  type: string;
  created: number;
  data: {
    object: {
      id: string;
      status?: string;
      metadata?: { company?: string };
      [key: string]: unknown;
    };
  };
};

export function planForEvent(event: StripeEvent): "free" | "paid" | null {
  const status = event.data.object.status;

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    if (status === "active" || status === "trialing") return "paid";
    if (status === "canceled" || status === "unpaid") return "free";
    return null;
  }

  if (event.type === "customer.subscription.deleted") return "free";

  return null;
}