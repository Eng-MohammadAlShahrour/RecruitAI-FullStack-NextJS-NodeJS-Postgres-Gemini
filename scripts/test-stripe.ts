import fs from "node:fs";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const URL = "http://127.0.0.1:3000/api/billing/events";

type Event = {
  description: string;
  headers: { "Stripe-Signature": string };
  payload: string;
};

const file = JSON.parse(fs.readFileSync("stripe-events.json", "utf8"));

async function post(body: string, sig: string) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Stripe-Signature": sig },
    body,
  });
  return res.status;
}

async function getPlan(company: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/companies?select=plan&id=eq." + company;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
  });
  const data = await res.json();
  return data[0]?.plan ?? "unknown";
}

async function main() {
  console.log("=== Testing " + file.events.length + " events ===\n");

  for (const e of file.events as Event[]) {
    const sig = e.headers["Stripe-Signature"];
    const status = await post(e.payload, sig);
    const acme = await getPlan("acme");
    const globex = await getPlan("globex");
    console.log(e.description.padEnd(45) + " => HTTP " + status + " | acme=" + acme + " globex=" + globex);
  }

  console.log("\n=== Final ===");
  console.log("acme:   " + await getPlan("acme"));
  console.log("globex: " + await getPlan("globex"));
  console.log("\nExpected: acme=free, globex=paid");
}

main().catch(console.error);