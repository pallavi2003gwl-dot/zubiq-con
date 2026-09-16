# Build Plan

Six phases. Each ends with something visible on screen. Do not start a phase before the
previous one renders correctly, because every later module depends on the query layer
built in Phase 2.

Rough effort estimates assume Claude Code doing the writing and one person reviewing.

---

## Phase 0: Setup (~30 min)

- [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- [ ] Install `@supabase/supabase-js`, `recharts`, `lucide-react`
- [ ] Create the Supabase project, run `supabase/schema.sql`
- [ ] Import all six CSVs in order: service_categories, sub_services, clients, engagements, leads, social_posts
- [ ] Verify `select * from v_category_alignment` returns six rows and
      `select * from v_subservice_alignment` returns thirty
- [ ] `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`
- [ ] `lib/supabase.ts` and `lib/format.ts` (INR formatter, date formatter)

**Checkpoint:** A page that fetches and prints the six alignment rows as raw JSON.
Ugly is fine. This proves the whole data path works before anything is designed.

---

## Phase 1: Shell and navigation (~30 min)

- [ ] App layout: sidebar with Overview, Clients, Leads, Upsell, Conversion, Alignment
- [ ] Header with the firm name and the data period (Apr–Sep 2026)
- [ ] Shared components: `KpiCard`, `DataTable` (sortable, filterable), `SectionHeading`, `EmptyState`
- [ ] Apply the visual direction from `CLAUDE.md`

**Checkpoint:** All six routes reachable, each with a placeholder.

---

## Phase 2: Module 1, the dashboard (~2 hrs)

This is the foundation. Every other module reuses these queries.

- [ ] `lib/queries.ts` with typed functions: `getClients()`, `getLeads()`,
      `getEngagements()`, `getCategoryAlignment()`, `getSubServiceAlignment()`
- [ ] Overview page: four KPI cards, revenue-by-category bar chart, clients-by-industry
      and by-turnover charts, lead funnel counts
- [ ] **Sub-service penetration heatmap**, 6 rows x 5 columns, shaded by penetration,
      statutory services marked. Build this carefully, it carries Module 2's whole case.
- [ ] `/clients` table with all filters, including the sub-service *missing* filter
- [ ] `/leads` table with filters, the 14-day staleness highlight, and graceful handling
      of blank fields from partial chatbot sessions

**Checkpoint:** Filters change the numbers. The penetration card shows roughly 4.8 of 30
sub-services against 2.9 of 6 categories. That contrast is the upsell story in one card.

---

## Phase 3: The AI plumbing (~1 hr)

Build this once, use it three times. Do not write the Gemini call three separate times.

- [ ] `/app/api/generate/route.ts` — POST handler taking `{ module, dataContext, instruction }`
- [ ] Module-to-system-instruction map from `docs/AI_PROMPTS.md`
- [ ] Gemini call with `gemini-3.5-flash-lite`. No temperature, top_p, or top_k.
- [ ] Error handling: missing key, 429, timeout, empty response. Each returns a readable message.
- [ ] `<AiPanel />` client component: collapsed locked data-context panel, editable
      instruction textarea pre-filled with the module default, Generate button,
      idle/loading/error/result states, and a copy-to-clipboard on the result

**Checkpoint:** A test page where `<AiPanel />` sends a hardcoded context and returns
real Gemini output. Once this works, the remaining modules are mostly data assembly.

---

## Phase 4: Modules 2 and 3 (~2.5 hrs)

Both follow the same shape: deterministic scoring first, AI second.

**Module 2, Upsell**
- [ ] `lib/upsell.ts` implementing rules R1-R13 from `docs/PRD.md`. Statutory rules
      R1-R8 first; they are the credible ones and should ship even if R9-R13 slip.
- [ ] `/upsell` page: summary strip, ranked opportunity table, detail panel
- [ ] Data context builder producing the exact block in `docs/AI_PROMPTS.md`
- [ ] Wire `<AiPanel module="upsell" />`

**Module 3, Conversion**
- [ ] `lib/leadScore.ts` implementing the five-component score, plus the two override
      rules: switching leads surface regardless of bucket, and leads without contact
      consent are excluded from every outreach list
- [ ] `/leads/conversion` page: Hot/Warm/Cold grouping, stale-lead callout,
      visible score breakdown
- [ ] Data context builder and `<AiPanel module="conversion" />`

**Checkpoint:** Roughly 70 statutory opportunities worth about Rs 16.79L from R1-R8.
Lead scores are explainable on screen, not a bare number.

---

## Phase 5: Module 4, alignment (~2 hrs)

The most important module for the marketing weight of the project. Give it the most
design attention.

- [ ] `lib/alignment.ts`: attention share, revenue share, gap, and the four-way label,
      computed at BOTH category and sub-service level
- [ ] Attention vs Revenue grouped bar chart
- [ ] Engagement rate vs lead volume scatter, with the untapped-demand quadrant shaded
- [ ] Full alignment table, with category rows that expand to sub-service rows
- [ ] Monthly trend line, engagements and leads, with a category filter
- [ ] The one-line correlation-not-attribution note under the trend chart
- [ ] Data context builder and `<AiPanel module="alignment" />`

**Checkpoint:** The charts make Incorporation look over-invested and Virtual CFO look
untapped without anyone needing to explain it. If a viewer cannot see it in two seconds,
redesign the chart, do not add more text.

---

## Phase 6: Polish and ship (~1.5 hrs)

- [ ] Loading skeletons on every data-fetching page
- [ ] Mobile check: the tables should scroll rather than break
- [ ] A short "About this prototype" page: data is synthetic, AI is on-demand, what is
      out of scope. This answers the first question the client will ask.
- [ ] Deploy to Vercel, set the three environment variables
- [ ] Verify the deployed build, cold start included
- [ ] Capture screenshots for the report appendix, including two different prompt
      variations producing different output from the same data

**Checkpoint:** A URL you can send to Satyam before the second interview.

---

## Total: roughly 10 working hours

Compressible if two people split it. The clean split point is after Phase 3: one person
takes Modules 2 and 3, the other takes Module 4, since they share the `<AiPanel />`
component and nothing else.

## If time runs short

Cut in this order:
1. Monthly trend chart in Module 4 (the alignment table still carries the finding)
2. `/clients` and `/leads` detail tables (the Overview page still shows segmentation)
2b. Sub-service drill-down inside the alignment table (the category view still carries
    the finding, though it loses the "which topic" specificity)
3. Module 3 (Modules 2 and 4 alone still tell a complete story: expand existing clients,
   fix the marketing allocation)

Never cut Module 4. It is what makes this a marketing project rather than a CRM.
