# ZubiQ AI Marketing Recommendation Engine (Pilot)

A prototype internal dashboard for **ZubiQ Consultants**, a Chartered Accountancy firm in
Sector 63, Noida. The tool reads the firm's client, lead, and social media data, surfaces
the gaps between them, and generates AI recommendations on demand.

Built as the pilot artefact for an AI Integration Project (AIM course, FORE School of Management).

---

## What it does

Four modules, in build order:

| # | Module | What it answers | AI? |
|---|--------|-----------------|-----|
| 1 | Client & Lead Dashboard | Who are our clients and leads, sliced by industry, sub-service, city, status? | No |
| 2 | Upsell / Cross-sell Engine | Which clients are missing a sub-service they are statutorily required to have, and what do we say to them? | Yes |
| 3 | Lead Conversion Planner | This lead came in 12 days ago and went cold. What is the play? | Yes |
| 4 | Social vs Sales Alignment | Where is our social effort going, and does it match where the money is? | Yes |

Module 1 is pure data. Modules 2, 3, and 4 each have a **Generate** button with an
editable prompt box next to it. Nothing calls the AI automatically.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (Postgres) |
| AI | Gemini `gemini-3.5-flash-lite` via Google AI Studio API key |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in your keys
npm run dev
```

### Supabase setup

1. Create a project at supabase.com.
2. Open the SQL Editor, paste and run `supabase/schema.sql`.
3. Go to Table Editor and import each CSV from `data/` into the matching table.
   Import in this order (foreign keys depend on it):
   `service_categories` → `sub_services` → `clients` → `engagements` → `leads` → `social_posts`
4. Copy the project URL and the anon key into `.env.local`.

### Gemini setup

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `.env.local` as `GEMINI_API_KEY`.
3. The key is **server-side only**. It is used inside `/app/api/generate/route.ts`
   and must never be exposed to the browser or prefixed with `NEXT_PUBLIC_`.

## Repo layout

```
docs/
  PRD.md                 Full module specs, screen by screen
  DATA_DICTIONARY.md     Every table, every column, and the gaps planted in the data
  AI_PROMPTS.md          Default prompt templates and the data-context contract
  BUILD_PLAN.md          Phased build order with checkpoints
  CHATBOT_SPEC.md        The chatbot flow the leads table was reverse-built from
                         (roadmap, not part of the pilot build)
supabase/
  schema.sql             Tables, constraints, indexes, and two helper views
data/
  generate_dummy_data.py Regenerates the CSVs (seeded, reproducible)
  *.csv                  Seed data for the pilot
```

## Important context

- All data in `data/` is **synthetic**. No real ZubiQ client information is used
  anywhere in this repo. The structure mirrors what a firm of this size would hold.
- The service catalogue has **two levels**: 6 categories and 30 sub-services. Everything
  the tool does operates at the sub-service level. At category level the client base
  looks well served (2.9 of 6); at sub-service level it holds 4.8 of 30. That gap is the
  commercial case for the tool, and the reason it is not a spreadsheet.
- In production the chatbot would write leads to a Google Sheet, and an Apps Script
  would sync them into Supabase. That pipeline is **out of scope for the pilot** and
  belongs in the scaling roadmap. For now, leads are seeded from CSV. The leads table
  was nonetheless designed backwards from that chatbot, see `docs/CHATBOT_SPEC.md`.
