import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const COMPANIES = [
  { id: "acme", name: "Acme", email: "recruiter@acme.test" },
  { id: "globex", name: "Globex", email: "recruiter@globex.test" },
];

const PASSWORD = "demo-password";

async function main() {
  for (const c of COMPANIES) {
    const { error: compErr } = await admin
      .from("companies")
      .upsert({ id: c.id, name: c.name }, { onConflict: "id" });
    if (compErr) throw compErr;

    const { data: list } = await admin.auth.admin.listUsers();
    let user = list?.users.find((u) => u.email === c.email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: c.email,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
      console.log("Created user " + c.email);
    } else {
      console.log("User " + c.email + " exists");
    }

    const { error: profErr } = await admin.from("profiles").upsert(
      {
        id: user!.id,
        company_id: c.id,
        email: c.email,
      },
      { onConflict: "id" }
    );
    if (profErr) throw profErr;

    console.log("Seeded " + c.id + " -> " + c.email);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });