import { createClient } from "@supabase/supabase-js";

export type Auth = {
  userId: string;
  companyId: string;
  email: string;
};

export async function requireRecruiter(
  req: Request
): Promise<Auth | { error: string }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "missing token" };
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return { error: "invalid token" };

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("company_id, email")
    .eq("id", userData.user.id)
    .single();

  if (profErr || !profile) return { error: "no profile" };

  return {
    userId: userData.user.id,
    companyId: profile.company_id,
    email: profile.email,
  };
}