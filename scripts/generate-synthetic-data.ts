import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const COUNT = Number(process.argv.find(a => a.startsWith("--count="))?.split("=")[1] ?? 500);
const OUTPUT_DIR = process.cwd();
const STRIPE_SECRET = "whsec_demo_test_secret";

const FIRST_NAMES = [
  "Mohammad","Amara","Mateo","Priya","Zoe","Hana","Yara","Kai","Elena","Sofia",
  "Lucas","Maya","Arjun","Ava","Ines","Noah","Chloe","Liam","Nadia","Ravi",
  "Omar","Felix","Mei","Leila","Theo","Jonah","Aisha","Kenji","Hiro","Wei",
  "Fatima","Ahmed","Sara","Yuki","Diego","Ana","Rania","Karim","Sana","Tariq",
];

const LAST_NAMES = [
  "Cohen","Costa","Lee","Rossi","Haddad","Okafor","Patel","Larsen","Silva","Murphy",
  "Tanaka","Mensah","Walsh","Ahmed","Kim","Brooks","Volkov","Fischer","Novak","Singh",
  "Moreau","Garcia","Nguyen","Reyes","Schmidt","Khan","Ali","Park","Chen","Yilmaz",
];

const ROLES = [
  "Backend Engineer","Frontend Engineer","Full Stack Engineer","Mobile Engineer",
  "DevOps Engineer","Data Engineer","Data Scientist","Machine Learning Engineer",
  "Product Designer","Product Manager","Marketing Manager","Account Executive","Recruiter",
];

const SKILLS_BY_ROLE: Record<string, string[]> = {
  "Backend Engineer": ["Go","Java","Python","Node.js","Postgres","Redis","Kafka","AWS","MySQL","Docker"],
  "Frontend Engineer": ["React","Vue","Svelte","Next.js","TypeScript","CSS","Tailwind","GraphQL","JavaScript","Accessibility"],
  "Full Stack Engineer": ["React","Node.js","Postgres","AWS","TypeScript","Next.js","GraphQL","Python","Tailwind","Docker"],
  "Mobile Engineer": ["Swift","Kotlin","Flutter","React Native","iOS","Android","TypeScript"],
  "DevOps Engineer": ["Docker","Kubernetes","Terraform","AWS","GCP","CI/CD","Ansible","Linux","Datadog"],
  "Data Engineer": ["Python","SQL","Spark","Kafka","Airflow","dbt","Snowflake","AWS","Scala"],
  "Data Scientist": ["Python","R","SQL","Pandas","Machine Learning","Statistics","A/B Testing","Tableau"],
  "Machine Learning Engineer": ["PyTorch","TensorFlow","LLMs","CUDA","MLOps","Python","Kubernetes","SQL"],
  "Product Designer": ["Figma","User Research","Prototyping","Design Systems","Webflow","Interaction Design"],
  "Product Manager": ["Roadmapping","Analytics","A/B Testing","SQL","User Research","Jira","Pricing"],
  "Marketing Manager": ["Content Marketing","SEO","HubSpot","Brand","Paid Social","Lifecycle Marketing"],
  "Account Executive": ["Enterprise Sales","SaaS","Salesforce","Negotiation","Pipeline Management","Outbound"],
  "Recruiter": ["Sourcing","Interviewing","Greenhouse","Employer Branding","Technical Recruiting"],
};

const CITIES = [
  { city: "New York", state: "NY" },{ city: "San Francisco", state: "CA" },
  { city: "Austin", state: "TX" },{ city: "Seattle", state: "WA" },
  { city: "Boston", state: "MA" },{ city: "Denver", state: "CO" },
  { city: "Chicago", state: "IL" },{ city: "Los Angeles", state: "CA" },
  { city: "Miami", state: "FL" },{ city: "Atlanta", state: "GA" },
];

const COMPANIES = [
  "Copperline","Tidal Health","Pebblepay","Northwind AI","Meridian Financial",
  "Hexlane","Pinnacle Insurance","Atlas Retail","Saltbox","Titan Software",
  "Globalcorp","Driftwood Data","Evergreen Bank","Fernway","Quillstack",
  "Harborview Health","Keystone Logistics","Arcadia Robotics","Paperplane","Summit Telecom",
  "Mintleaf","Beacon Energy","Crescent Media","Orbitly","Brightpath",
  "Lumen Labs","Kitebird","Ironclad Systems","Aurora Tech","Vertex Labs",
];

const SCHOOLS = [
  "University of Texas at Austin","UC Berkeley","University of Michigan","MIT",
  "Stanford University","Cornell University","Georgia Tech","Carnegie Mellon University",
  "University of Washington","Northeastern University","New York University",
  "Columbia University","University of Illinois",
];

const DEGREES = ["BS","BA","MS","MBA","PhD"];
const FIELDS = ["Computer Science","Mathematics","Electrical Engineering","Computer Engineering","Economics","Business","Psychology","Physics","Marketing","Communications","Design","Statistics"];

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]; const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy[idx]); copy.splice(idx, 1);
  }
  return out;
}
function randInt(min: number, max: number): number { return Math.floor(rand() * (max - min + 1)) + min; }
function seniorityFor(years: number): string {
  if (years < 2) return "junior";
  if (years < 5) return "mid";
  if (years < 9) return "senior";
  if (years < 13) return "staff";
  return "principal";
}
function avatarUrl(id: string): string {
  const bg = pick(["b6e3f4","c0aede","d1d4f9","ffd5dc","ffdfbf","c0e8d5"]);
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${id}&backgroundColor=${bg}`;
}
function companyLogoUrl(name: string): string {
  const bg = pick(["4f46e5","7c3aed","0ea5e9","10b981","f59e0b","ef4444"]);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${bg}`;
}

type RawCandidate = {
  id: string; full_name: string; avatar_url: string; headline: string;
  current_title: string; current_company: string; current_company_logo_url: string;
  role: string; seniority: string; years_experience: number;
  location: { city: string; state: string; country: string };
  open_to_work: boolean; skills: string[];
  experiences: Array<{ title: string; company: string; company_logo_url: string; company_type: string; start_year: number; end_year: number | null; description: string; }>;
  education: Array<{ school: string; degree: string; field: string; graduation_year: number; }>;
};

function generateCandidate(i: number): RawCandidate {
  const id = `cand_${String(i).padStart(4, "0")}`;
  const first = pick(FIRST_NAMES); const last = pick(LAST_NAMES);
  const full = `${first} ${last}`;
  const role = pick(ROLES); const years = randInt(0, 15);
  const seniority = seniorityFor(years); const city = pick(CITIES);
  const skills = pickN(SKILLS_BY_ROLE[role], randInt(3, 6));
  const openToWork = rand() < 0.25; const company = pick(COMPANIES);
  const titleWord = seniority === "junior" ? "Junior" : seniority === "mid" ? "" : seniority.charAt(0).toUpperCase() + seniority.slice(1);
  const currentTitle = `${titleWord ? titleWord + " " : ""}${role}`.trim();
  const headline = `${currentTitle} · ${skills.slice(0, 3).join(", ")}`;
  const numJobs = randInt(1, 3);
  const experiences: RawCandidate["experiences"] = [];
  let endYear: number | null = 2026;
  let currentCompany = company;
  for (let j = 0; j < numJobs; j++) {
    const startYear = endYear! - randInt(1, 4);
    const jobTitle = j === 0 ? currentTitle : `${pick(["Junior","Senior","Staff",""])} ${role}`.trim();
    const jobCompany = j === 0 ? company : pick(COMPANIES);
    const isStartup = rand() < 0.5;
    experiences.push({ title: jobTitle, company: jobCompany, company_logo_url: companyLogoUrl(jobCompany), company_type: isStartup ? "startup" : "enterprise", start_year: startYear, end_year: endYear, description: `${jobTitle} at ${jobCompany}.` });
    endYear = startYear;
  }
  const gradYear = 2026 - years - randInt(0, 3);
  const education = [{ school: pick(SCHOOLS), degree: pick(DEGREES), field: pick(FIELDS), graduation_year: Math.max(2000, gradYear) }];
  return { id, full_name: full, avatar_url: avatarUrl(id), headline, current_title: currentTitle, current_company: currentCompany, current_company_logo_url: companyLogoUrl(currentCompany), role, seniority, years_experience: years, location: { city: city.city, state: city.state, country: "US" }, open_to_work: openToWork, skills, experiences, education };
}

function generateQueries(candidates: RawCandidate[]) {
  const q1 = candidates.filter(c => c.seniority === "senior" && c.skills.map(s => s.toLowerCase()).includes("react") && c.location.city === "New York" && c.experiences.some(e => e.company_type === "startup")).map(c => c.id);
  const q2 = candidates.filter(c => c.role === "Data Scientist" && c.education.some(e => e.degree.toLowerCase() === "phd")).map(c => c.id);
  const q3 = candidates.filter(c => c.role === "Frontend Engineer" && c.seniority === "junior" && c.location.city === "Boston" && c.open_to_work === true).map(c => c.id);
  const q4 = candidates.filter(c => c.role === "Mobile Engineer" && c.skills.map(s => s.toLowerCase()).includes("swift")).map(c => c.id);
  return [
    { brief: "senior React engineers in New York who have worked at a startup", expected_ids: q1 },
    { brief: "data scientists with a PhD", expected_ids: q2 },
    { brief: "junior frontend engineers in Boston who are open to work", expected_ids: q3 },
    { brief: "mobile engineers who know Swift", expected_ids: q4 },
    { brief: "product managers who speak Japanese", expected_ids: [] },
  ];
}

function signStripe(body: string, secret: string, timestamp: number): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

function generateStripeEvents() {
  const events: Array<{ description: string; headers: { "Stripe-Signature": string }; payload: string }> = [];
  const add = (desc: string, payload: object, ts: number) => {
    const body = JSON.stringify(payload);
    events.push({ description: desc, headers: { "Stripe-Signature": signStripe(body, STRIPE_SECRET, ts) }, payload: body });
  };
  const base = 1791211200;
  add("acme subscribes", { id: "evt_demo_acme_1", object: "event", created: base, type: "customer.subscription.created", data: { object: { id: "sub_demo_acme", status: "active", metadata: { company: "acme" } } } }, base);
  add("the same event delivered again", { id: "evt_demo_acme_1", object: "event", created: base, type: "customer.subscription.created", data: { object: { id: "sub_demo_acme", status: "active", metadata: { company: "acme" } } } }, base + 5);
  add("globex's newer event arrives first", { id: "evt_demo_globex_2", object: "event", created: base + 120, type: "customer.subscription.updated", data: { object: { id: "sub_demo_globex", status: "active", metadata: { company: "globex" } } } }, base + 130);
  add("globex's older event arrives late", { id: "evt_demo_globex_1", object: "event", created: base + 60, type: "customer.subscription.created", data: { object: { id: "sub_demo_globex", status: "incomplete", metadata: { company: "globex" } } } }, base + 135);
  add("acme cancels", { id: "evt_demo_acme_2", object: "event", created: base + 180, type: "customer.subscription.deleted", data: { object: { id: "sub_demo_acme", status: "canceled", metadata: { company: "acme" } } } }, base + 180);
  return { note: "Sample signed Stripe webhook events. Secret: whsec_demo_test_secret", events, expected_plans_after: { acme: "free", globex: "paid" } };
}

function main() {
  console.log(`Generating ${COUNT} candidates...`);
  const candidates: RawCandidate[] = [];
  for (let i = 1; i <= COUNT; i++) candidates.push(generateCandidate(i));
  fs.writeFileSync(path.join(OUTPUT_DIR, "candidates.json"), JSON.stringify(candidates, null, 0));
  console.log(`OK candidates.json (${(fs.statSync(path.join(OUTPUT_DIR, "candidates.json")).size / 1024).toFixed(0)} KB)`);
  const queries = generateQueries(candidates);
  fs.writeFileSync(path.join(OUTPUT_DIR, "queries.json"), JSON.stringify(queries, null, 2));
  console.log(`OK queries.json (${queries.map(q => q.expected_ids.length).join("/")} expected per query)`);
  const events = generateStripeEvents();
  fs.writeFileSync(path.join(OUTPUT_DIR, "stripe-events.json"), JSON.stringify(events, null, 2));
  console.log(`OK stripe-events.json (secret: ${STRIPE_SECRET})`);
  console.log("");
  console.log("Done.");
}

main();