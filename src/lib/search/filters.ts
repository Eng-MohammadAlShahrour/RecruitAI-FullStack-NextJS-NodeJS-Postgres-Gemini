import type { SearchFilters } from "./llm";

const ROLES = new Set([
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Designer",
  "Product Manager",
  "Marketing Manager",
  "Account Executive",
  "Recruiter",
]);

const SENIORITIES = new Set(["junior", "mid", "senior", "staff", "principal"]);

// ⚠️ City aliases — normalize NYC → New York, etc.
const CITY_ALIASES: Record<string, string> = {
  "nyc": "New York",
  "new york city": "New York",
  "new york": "New York",
  "ny": "New York",
  "sf": "San Francisco",
  "san fran": "San Francisco",
  "san francisco": "San Francisco",
  "la": "Los Angeles",
  "los angeles": "Los Angeles",
  "chi": "Chicago",
  "chi town": "Chicago",
  "chicago": "Chicago",
  "atx": "Austin",
  "austin": "Austin",
  "sea": "Seattle",
  "seattle": "Seattle",
  "bos": "Boston",
  "boston": "Boston",
  "den": "Denver",
  "denver": "Denver",
  "mia": "Miami",
  "miami": "Miami",
  "atl": "Atlanta",
  "atlanta": "Atlanta",
};

function normalizeCity(raw: string): string {
  const key = raw.trim().toLowerCase();
  return CITY_ALIASES[key] ?? raw.trim();
}

// Split "New York or San Francisco" / "NY and SF" / "NY, SF" into separate cities
function splitCity(raw: string): string[] {
  const t = raw.trim();
  // Split on " or ", " and ", " , ", or comma
  const parts = t.split(/\s+or\s+|\s+and\s+|,\s*|\s*,\s*/i);
  if (parts.length > 1) {
    return parts.map((p) => p.trim()).filter(Boolean);
  }
  return [t];
}

const TECH_SKILLS = new Set([
  "react", "vue", "angular", "svelte", "next.js", "nextjs",
  "typescript", "javascript", "python", "go", "golang", "java",
  "kotlin", "swift", "rust", "scala", "ruby", "php",
  "c++", "c#", "csharp",
  "pytorch", "tensorflow", "keras", "scikit-learn",
  "kubernetes", "docker", "aws", "gcp", "azure",
  "postgres", "postgresql", "mysql", "mongodb", "redis",
  "graphql", "tailwind", "css", "html", "node.js", "nodejs",
]);

const STRIP_ROLE_WHEN_TECH_ONLY = new Set([
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
]);

const DEGREE_MAP: Record<string, string> = {
  phd: "phd", doctorate: "phd", doctoral: "phd",
  ms: "ms", master: "ms", masters: "ms", "master's": "ms", msc: "ms",
  bs: "bs", bachelor: "bs", bachelors: "bs", "bachelor's": "bs", bsc: "bs",
  ba: "ba",
  mba: "mba",
};

export function sanitize(raw: unknown): SearchFilters {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: SearchFilters = {};

  if (typeof r.role === "string" && ROLES.has(r.role)) {
    out.role = r.role;
  }

  if (typeof r.seniority === "string" && SENIORITIES.has(r.seniority)) {
    out.seniority = r.seniority as SearchFilters["seniority"];
  }

  // locations — with alias normalization
  const locs: string[] = [];
  const addLoc = (raw: string) => {
    for (const piece of splitCity(raw)) {
      locs.push(normalizeCity(piece).slice(0, 60));
    }
  };
  if (Array.isArray(r.locations)) {
    for (const l of r.locations) {
      if (typeof l === "string" && l.trim()) addLoc(l);
    }
  }
  if (typeof r.location === "string" && r.location.trim()) {
    addLoc(r.location);
  }
  if (locs.length > 0) {
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const l of locs) {
      const key = l.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(l);
      }
    }
    out.locations = uniq;
  }

  if (typeof r.min_years === "number" && r.min_years >= 0 && r.min_years <= 60) {
    out.min_years = Math.floor(r.min_years);
  }
  if (typeof r.max_years === "number" && r.max_years >= 0 && r.max_years <= 60) {
    out.max_years = Math.floor(r.max_years);
  }
  if (out.min_years != null && out.max_years != null && out.min_years > out.max_years) {
    delete out.max_years;
  }

  if (Array.isArray(r.skills)) {
    const skills = r.skills
      .filter((x): x is string =>
        typeof x === "string" && x.trim().length > 0 && x.length <= 40)
      .map((x) => x.toLowerCase().trim())
      .slice(0, 8);
    if (skills.length > 0) out.skills = skills;
  }

  if (r.worked_at_startup === true) out.worked_at_startup = true;

  if (Array.isArray(r.worked_at)) {
    const wa = r.worked_at
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.toLowerCase().trim())
      .slice(0, 5);
    if (wa.length > 0) out.worked_at = wa;
  }

  if (typeof r.studied_at === "string" && r.studied_at.trim()) {
    out.studied_at = r.studied_at.trim().slice(0, 60);
  }

  if (typeof r.degree === "string") {
    const d = r.degree.toLowerCase().trim();
    out.degree = DEGREE_MAP[d] ?? d.slice(0, 10);
  }

  if (typeof r.open_to_work === "boolean") out.open_to_work = r.open_to_work;

  // POST-CHECK: strip role if only tech skills are present
  if (out.role && STRIP_ROLE_WHEN_TECH_ONLY.has(out.role) && out.skills?.length) {
    const allTech = out.skills.every((s) => TECH_SKILLS.has(s));
    if (allTech) {
      delete out.role;
    }
  }

  return out;
}

export function isEmpty(f: SearchFilters): boolean {
  return Object.keys(f).length === 0;
}