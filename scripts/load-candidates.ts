import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type RawCandidate = {
  id: string;
  full_name: string;
  avatar_url: string;
  headline: string;
  current_title: string;
  current_company: string;
  current_company_logo_url: string;
  role: string;
  seniority: string;
  years_experience: number;
  location: { city: string; state: string; country: string };
  open_to_work: boolean;
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    company_logo_url: string;
    company_type: string;
    start_year: number;
    end_year: number | null;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    graduation_year: number;
  }>;
};

async function main() {
  const raw = JSON.parse(
    fs.readFileSync("candidates.json", "utf8")
  ) as RawCandidate[];

  console.log("Loaded " + raw.length + " candidates from JSON");

  const rows = raw.map((c) => {
    const skills = Array.isArray(c.skills) ? c.skills : [];
    const exps = Array.isArray(c.experiences) ? c.experiences : [];
    const edus = Array.isArray(c.education) ? c.education : [];

    const companies = Array.from(
      new Set(exps.map((e) => (e.company ?? "").toLowerCase()).filter(Boolean))
    );
    const schools = Array.from(
      new Set(edus.map((e) => e.school ?? "").filter(Boolean))
    );
    const degrees = Array.from(
      new Set(edus.map((e) => (e.degree ?? "").toLowerCase()).filter(Boolean))
    );
    const workedStartup = exps.some((e) => e.company_type === "startup");

    return {
      id: c.id,
      full_name: c.full_name,
      avatar_url: c.avatar_url,
      headline: c.headline,
      current_title: c.current_title,
      current_company: c.current_company,
      current_company_logo_url: c.current_company_logo_url,
      role: c.role,
      seniority: c.seniority,
      years_experience: c.years_experience,
      location_city: c.location?.city ?? "",
      location_state: c.location?.state ?? null,
      location_country: c.location?.country ?? null,
      open_to_work: !!c.open_to_work,
      skills,
      skills_lc: skills.map((s) => s.toLowerCase()),
      worked_at_startup: workedStartup,
      worked_at_companies: companies,
      studied_at_schools: schools,
      degrees,
      experiences: exps,
      education: edus,
    };
  });

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await admin.from("candidates").upsert(batch);
    if (error) {
      console.error("Batch " + i + " failed:", error);
      throw error;
    }
    console.log("Loaded " + (i + batch.length) + "/" + rows.length);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });