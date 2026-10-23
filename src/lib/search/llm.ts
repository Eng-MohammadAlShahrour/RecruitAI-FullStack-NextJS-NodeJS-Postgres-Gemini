import { GoogleGenerativeAI } from "@google/generative-ai";

export type SearchFilters = {
  role?: string;
  seniority?: "junior" | "mid" | "senior" | "staff" | "principal";
  locations?: string[];
  min_years?: number;
  max_years?: number;
  skills?: string[];
  worked_at_startup?: boolean;
  worked_at?: string[];
  studied_at?: string;
  degree?: string;
  open_to_work?: boolean;
};

const ROLE_VOCAB = [
  "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
  "Mobile Engineer", "DevOps Engineer", "Data Engineer",
  "Data Scientist", "Machine Learning Engineer", "Product Designer",
  "Product Manager", "Marketing Manager", "Account Executive", "Recruiter",
];

const SYSTEM = `Convert brief to JSON filters. Omit unstated fields.

Schema: { role?: string, seniority?: "junior"|"mid"|"senior"|"staff"|"principal", locations?: string[], min_years?: number, max_years?: number, skills?: string[], worked_at_startup?: boolean, worked_at?: string[], studied_at?: string, degree?: string, open_to_work?: boolean }

Roles: ${ROLE_VOCAB.join(", ")}

Rules:
1. Tech names (React, Swift, Go, PyTorch) -> skills only, NO role.
   "React people" -> {"skills":["react"]}
   "React engineers" -> {"skills":["react"]}
2. Multi-city: "NY or SF" -> {"locations":["New York","San Francisco"]}
   "NYC" -> {"locations":["New York"]}
3. "startup" -> worked_at_startup: true
4. Unanswerable/vague -> {}
5. Never invent values.

Examples:
"senior React engineers in New York who have worked at a startup" -> {"seniority":"senior","skills":["react"],"locations":["New York"],"worked_at_startup":true}
"React people in NYC" -> {"skills":["react"],"locations":["New York"]}
"ML in NY or SF who know PyTorch" -> {"role":"Machine Learning Engineer","locations":["New York","San Francisco"],"skills":["pytorch"]}
"data scientists with a PhD" -> {"role":"Data Scientist","degree":"phd"}`;

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    client = new GoogleGenerativeAI(key);
  }
  return client;
}

const MODEL = "gemini-3.1-flash-lite";

// Progressive timeouts: fast first, lenient second
const ATTEMPTS = [
  { timeoutMs: 3000, label: "fast" },
  { timeoutMs: 7000, label: "lenient" },
];

async function tryOnce(g: GoogleGenerativeAI, brief: string, timeoutMs: number): Promise<string> {
  const model = g.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 200,
      temperature: 0,
    },
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("LLM_TIMEOUT")), timeoutMs)
  );

  const res = await Promise.race([
    model.generateContent(brief.slice(0, 400)),
    timeout,
  ]);

  return res.response.text();
}

export async function briefToFilters(brief: string): Promise<SearchFilters> {
  const g = getClient();
  let lastErr: unknown = null;

  for (let i = 0; i < ATTEMPTS.length; i++) {
    const { timeoutMs, label } = ATTEMPTS[i];
    const t0 = Date.now();
    try {
      const text = await tryOnce(g, brief, timeoutMs);
      const elapsed = Date.now() - t0;
      console.log(`[LLM] ${MODEL} attempt ${i + 1} (${label}, ${timeoutMs}ms) -> ${elapsed}ms`);
      try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    } catch (e) {
      const elapsed = Date.now() - t0;
      lastErr = e;
      console.warn(`[LLM] ${MODEL} attempt ${i + 1} (${label}) failed after ${elapsed}ms`);
    }
  }

  throw lastErr ?? new Error("LLM failed after retries");
}