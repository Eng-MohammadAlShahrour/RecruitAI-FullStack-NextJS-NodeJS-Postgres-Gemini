import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anon = createClient(SUPABASE_URL, ANON);
const admin = createClient(SUPABASE_URL, SERVICE);

const queries = JSON.parse(fs.readFileSync("queries.json", "utf8"));

async function main() {
  const { data: auth } = await anon.auth.signInWithPassword({
    email: "recruiter@acme.test",
    password: "demo-password",
  });
  const token = auth!.session!.access_token;

  let totalRecall = 0, totalExpected = 0, totalReturned = 0, totalCorrect = 0;

  for (const q of queries) {
    // reset search counter
    await admin.from("companies").update({ searches_used: 0 }).eq("id", "acme");

    const res = await fetch("http://127.0.0.1:3000/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ brief: q.brief }),
    });

    if (!res.ok) {
      console.log("FAIL: " + q.brief + " -> " + res.status);
      continue;
    }

    const data = await res.json();
    const returnedIds = new Set(data.results.map((r: any) => r.id));
    const expectedIds = new Set(q.expected_ids);
    const correct = [...returnedIds].filter((id) => expectedIds.has(id)).length;

    totalExpected += expectedIds.size;
    totalReturned += returnedIds.size;
    totalCorrect += correct;
    totalRecall += correct;

    console.log(
      JSON.stringify({
        brief: q.brief.slice(0, 50),
        expected: expectedIds.size,
        returned: returnedIds.size,
        correct: correct,
        total: data.total,
      })
    );
  }

  console.log("");
  console.log("=== TOTALS (first page of 20) ===");
  console.log("Recall: " + ((totalCorrect / totalExpected) * 100).toFixed(1) + "%");
  console.log("Precision: " + ((totalCorrect / totalReturned) * 100).toFixed(1) + "%");
}

main().catch(console.error);