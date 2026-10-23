<div align="center">

# RecruitAI

### Plain-English candidate search for recruiters

A full-stack TypeScript app where a recruiter types a brief like
*"senior React engineers in New York who have worked at a startup"*,
an LLM turns it into structured filters, and Postgres returns ranked,
paged candidates.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Local-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Node](https://img.shields.io/badge/Node-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Required-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## What it does

| Feature | How |
|---|---|
| **Search in English** | Brief → Gemini → structured filters → Postgres ranking |
| **City aliases** | "NYC", "NY", "New York" → all normalize to "New York" |
| **Multi-city OR** | "New York or San Francisco" → locations: ["New York", "San Francisco"] |
| **Role vs skill** | "React people" → skills only; never a hardcoded role |
| **Correct the search** | Filters shown as chips; remove or edit without retyping |
| **View a candidate** | Experience, education, skills, availability |
| **Shortlist** | Named lists: create, rename, delete, add/remove members |
| **Save a search** | Persist a brief + filters, re-run later |
| **Two isolated companies** | Row-level security at Postgres |
| **Free plan** | 2 searches/company, atomic on server |
| **Stripe billing** | Signed webhooks, idempotent, order-aware |

---

## Quick Start

Set your Gemini API key (free at https://aistudio.google.com/apikey), then:

    export GEMINI_API_KEY="your-key-here"
    make setup
    make dev

Sign in:

| Company | Email | Password |
|---|---|---|
| **Acme** | recruiter@acme.test | demo-password |
| **Globex** | recruiter@globex.test | demo-password |

> **First run takes ~5 minutes** while Docker pulls the Supabase images.

### Prerequisites

| Tool | Version |
|---|---|
| **Node** | 24 |
| **Supabase CLI** | 2.119.0 |
| **Next.js** | 16 |
| **Docker Desktop** | ≥ 24 |

`make setup` auto-creates `.env.local` from `.env.example`. Only `GEMINI_API_KEY` must be set manually.

### Sample Data

This repo does not include a candidate dataset. To run the app locally:

1. Create a `candidates.json` file at the project root. The schema is
   defined in `scripts/load-candidates.ts` (see the `RawCandidate` type).
2. Run `make setup`.

Any synthetic dataset matching `RawCandidate` works — the search pipeline
and RLS don't depend on specific content.

---

## Architecture

    Next.js 16 (App Router)
      /login → /search → /people/[id]
                       ├→ /shortlists → /shortlists/[id]
                       └→ /saved
           │
           ▼
      API Routes (bearer-authenticated)
       /api/search  /api/people  /api/shortlists  /api/saved-briefs
       /api/plan    /api/billing/events
           │
           ▼
      Supabase (local, Docker)
       Postgres 17 + Auth + Studio
       RLS via auth_company_id()
           │
           ▼
      Gemini Flash (filters only)

### Directory layout

    src/
    ├── app/
    │   ├── (app)/
    │   │   ├── layout.tsx
    │   │   ├── search/page.tsx
    │   │   ├── people/[id]/page.tsx
    │   │   ├── shortlists/page.tsx
    │   │   ├── shortlists/[id]/page.tsx
    │   │   └── saved/page.tsx
    │   ├── api/
    │   └── login/page.tsx
    ├── components/
    └── lib/
        ├── auth.ts
        ├── api-client.ts
        ├── search/
        │   ├── llm.ts
        │   └── filters.ts
        ├── billing/stripe.ts
        └── supabase/

    supabase/migrations/
    ├── 0001_schema.sql
    ├── 0002_rls.sql
    ├── 0003_functions.sql
    ├── 0004_fix_plan.sql
    ├── 0005_locations.sql
    └── 0006_free_searches.sql

    scripts/
    ├── seed-auth.ts
    ├── load-candidates.ts
    ├── ensure-env.mjs
    ├── check-queries.ts
    └── test-stripe.ts

---

## Search Pipeline

    brief → Gemini → sanitize → search_candidates(jsonb) → result_ids[]
                                                                │
           GET /api/search/{id}?page=N ←── slice(20) ──────────┘

1. **LLM → filters.** Only the brief + closed schema go to the model.
2. **Sanitize.** Drops unsupported keys, clamps lengths, normalizes
   city aliases (NYC → New York), splits multi-city strings, and strips
   role when only a technology is present.
3. **Postgres ranks.** Hard filters + relevance score.
4. **Paging is free.** result_ids cached once; page slices 20.

### Why the LLM can't invent filters

| Guard | Where |
|---|---|
| Closed role vocabulary | Prompt + sanitize() |
| Strict JSON schema | responseMimeType: application/json |
| "Return empty if unanswerable" | Prompt |
| City alias normalization | filters.ts (CITY_ALIASES) |
| Multi-city splitting | filters.ts (splitCity) |
| Role strip when tech-only | filters.ts (post-check) |
| No candidate data to model | Architectural |

**Real examples:**

| Brief | LLM (before sanitize) | After sanitize |
|---|---|---|
| React people in NYC | role + skills + locations:["NYC"] | skills + locations:["New York"] |
| ML in NY or SF who know PyTorch | locations:["New York or San Francisco"] | locations:["New York","San Francisco"] |
| product managers who speak Japanese | role:"Product Manager" | {} → 0 results |

---

## Security Model

### Three layers

1. **Postgres RLS** — every table secured by auth_company_id() (SECURITY DEFINER).
2. **API routes** — requireRecruiter() re-validates the bearer token; every query scoped by company_id.
3. **companies has no write policy** — only the service role (Stripe webhook) can change plan.

### Secrets never reach the browser

| Secret | Where |
|---|---|
| SUPABASE_SERVICE_ROLE_KEY | Server routes + scripts |
| GEMINI_API_KEY | llm.ts (server) |
| STRIPE_WEBHOOK_SECRET | Webhook route |

### Free plan is atomic

    update companies
       set searches_used = searches_used + 1
     where id = company_id
       and (plan = 'paid' or searches_used < 2)

### Stripe webhook

- **HMAC-SHA256** with timingSafeEqual
- **Idempotent** via stripe_events.event_id primary key
- **Order-aware** — events with created <= plan_state_at ignored

---

## Billing

    POST /api/billing/events
      1. Verify HMAC              → 400 on failure
      2. Extract metadata.company
      3. INSERT stripe_events     → duplicate = 200 OK
      4. Compare created vs plan_state_at
      5. Reduce → "free" | "paid" | null
      6. UPDATE companies if changed

| Event | Status | Plan |
|---|---|---|
| customer.subscription.created | active, trialing | **paid** |
| customer.subscription.created | canceled, unpaid | **free** |
| customer.subscription.created | anything else | no change |
| customer.subscription.updated | same | same |
| customer.subscription.deleted | any | **free** |
| invoice.payment_failed | — | no change |

---

## API Reference

All routes accept Authorization: Bearer token except /api/billing/events.

| Method | Route | Body | Returns |
|---|---|---|---|
| POST | /api/search | { brief } | { search_id, filters, total, results, searches_remaining } — 402 if no searches |
| GET | /api/search/{id}?page=N | — | { search_id, filters, total, page, results } |
| GET | /api/people/{id} | — | Candidate |
| GET | /api/shortlists | — | { shortlists } |
| POST | /api/shortlists | { name } | { id } |
| PATCH | /api/shortlists/{id} | { name } | { ok: true } |
| DELETE | /api/shortlists/{id} | — | { ok: true } |
| POST | /api/shortlists/{id}/people/{pid} | — | { ok: true } |
| DELETE | /api/shortlists/{id}/people/{pid} | — | { ok: true } |
| GET | /api/saved-briefs | — | { saved_briefs } |
| POST | /api/saved-briefs | { brief, filters } | { id } |
| DELETE | /api/saved-briefs/{id} | — | { ok: true } |
| GET | /api/plan | — | { plan, searches_remaining } |
| POST | /api/billing/events | Stripe event | { ok: true } — 400 on bad signature |

---

## Tradeoffs

- **result_ids array** — one read per page, no join.
- **Denormalized columns at load** — skills_lc, worked_at_startup, degrees, studied_at_schools.
- **GIN indexes** — array containment in ms; pg_trgm for city typo tolerance.
- **Server-side auth only** — direct Supabase writes blocked by RLS.
- **No LLM streaming** — response fits in one round-trip.
- **No incremental migrations** — db reset on fresh machine.

---

## Roadmap

1. **Inline filter editing** — click a chip to remove/edit and re-run.
2. **pgvector + embeddings** — vague briefs fall back to embedding similarity.
3. **Streaming LLM** — first paint ~400 ms sooner.
4. **Playwright isolation suite** — automate two-company cross-read tests.
5. **Cursor-based paging** — after=id stays O(1) at scale.

---

*Built with Next.js · Supabase · PostgreSQL · Gemini*