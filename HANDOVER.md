# ZubiQ AI Marketing Recommendation Engine — Technical Handover

**Purpose of this document:** a complete technical and process record of the pilot build, written to be handed to an AI assistant (or a human reviewer) as source material for the project report. It covers what was built, why, how, the exact business logic implemented, the tools and versions used, and every deviation found between the planning docs and the actual data/behavior.

**Project:** Internal AI-assisted marketing/CRM dashboard for ZubiQ Consultants, a Chartered Accountancy firm in Sector 63, Noida, India. Built as the pilot artefact for an AI Integration Project (AIM course, FORE School of Management).

**Status as of handover:** All 4 modules built, wired to live Supabase data, all 3 AI panels tested end-to-end against the real Gemini API, production build passes clean (`npm run build`, zero TypeScript errors, zero ESLint warnings). Not yet deployed to Vercel; not yet a git repository.

---

## 1. Problem statement and objective

ZubiQ holds three data pools that never speak to each other: existing clients, inbound leads, and social media output. The firm thinks in **6 service categories**, but actually sells **30 distinct sub-services** — at category level the client base looks well-served (average 2.9 of 6 categories held), but at sub-service level the same base holds only **4.8 of 30** (~16% penetration). That gap between the two numbers is the commercial argument for the entire tool: a 6×50 pivot table is something anyone can build in Excel; a 30×50 matrix, where each cell has its own statutory trigger and turnover condition, checked every month, is not something a small team maintains by hand.

The pilot's job: unify the three data pools **at sub-service granularity**, surface the gaps deterministically, and use an LLM (on explicit user request only, never automatically) to turn each gap into a specific, ready-to-send action.

### Marketing frameworks applied (for report Section 4/5 — Proposed AI Solution)

| Framework | Where it appears in the build |
|---|---|
| STP (Segmentation/Targeting/Positioning) | Module 1 — client base segmented by industry, entity type, turnover band, service mix |
| CLV / Share of wallet | Module 2 — the upsell engine is a CLV-expansion tool measured as share of a 30-service wallet |
| Sales Funnel + AIDA | Module 3 — leads scored by stage/urgency/staleness; AI writes the Interest→Action message |
| Marketing Mix (Promotion effectiveness) | Module 4 — promotional effort per service vs. demand and revenue for that service |

---

## 2. Tech stack

| Layer | Choice | Version (as installed) |
|---|---|---|
| Framework | Next.js, App Router | 16.3.5 |
| UI library | React | 19.2.8 |
| Language | TypeScript | ^5 (strict mode on) |
| Styling | Tailwind CSS | ^4 (CSS-based `@theme` config, not the old `tailwind.config.ts`) |
| Charts | Recharts | ^3.10.1 |
| Icons | lucide-react | ^1.46.0 |
| Database client | @supabase/supabase-js | ^2.116.0 |
| Database | Supabase (hosted Postgres) | — |
| AI model | Google Gemini, `gemini-3.5-flash-lite` | via REST (`generativelanguage.googleapis.com/v1beta`) |
| Package manager | npm | — |
| Dev/runtime | Node.js (via Homebrew) | v26.8.2 (non-LTS; `node@22` is the documented fallback if issues appear) |
| Hosting target | Vercel | not yet deployed |

No ORM is used — the Supabase JS client queries tables and two SQL views directly, with hand-written TypeScript row types kept in sync manually (see §6).

---

## 3. Architecture overview

```
Browser
  │
  ├─ Server Components (app/*/page.tsx)
  │     └─ fetch via lib/queries.ts → Supabase (anon key, RLS-gated read-only)
  │     └─ pure business-logic libs (lib/upsell.ts, lib/leadScore.ts, lib/alignment.ts)
  │           compute deterministic results server-side, before any AI is involved
  │
  ├─ Client Components (components/*)
  │     └─ interactive filtering/sorting/drawers (useState/useMemo, no server round-trip)
  │     └─ <AiPanel> — the only thing that talks to the AI route
  │
  └─ POST /api/generate  (app/api/generate/route.ts, server-only)
        └─ composes system instruction + locked data context + user instruction
        └─ calls Gemini REST API with the server-side GEMINI_API_KEY
        └─ returns { text } or { error } with a real HTTP status
```

**Key architectural rules enforced throughout:**

1. **No AI call fires automatically.** Every generation is behind an explicit "Generate…" button click inside `<AiPanel>`. Nothing calls Gemini on page load, mount, or data refresh.
2. **The Gemini key never reaches the browser.** All model calls happen inside the single route handler `app/api/generate/route.ts`. The client only ever calls `fetch("/api/generate", ...)`. `GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix.
3. **Server Components fetch, Client Components interact.** Data fetching (`lib/queries.ts`) always happens in `async function Page()` Server Components. `"use client"` is reserved for components that need state, event handlers, or browser-only APIs (filters, drawers, charts, the AI panel).
4. **All 6 data-fetching routes are forced dynamic** (`export const dynamic = "force-dynamic"`) so every page load re-queries Supabase — see §11 for why this was a real bug that had to be fixed.
5. **One Supabase client, one INR formatter, one date formatter.** `lib/supabase.ts` exports a single `supabase` client instance; nothing else calls `createClient()`. `lib/format.ts` exports `formatINR()` and `formatDate()`, used everywhere money/dates render.

---

## 4. Database schema

Postgres (via Supabase). Full DDL in `supabase/schema.sql`. Six base tables, two computed views, Row Level Security enabled on every table with a permissive read-only policy (see §11.1 for why this was necessary).

### 4.1 Tables

| Table | Rows | Key columns |
|---|---|---|
| `service_categories` | 6 | `service_id` (SVC01–06), `service_category`, `category_name` |
| `sub_services` | 30 | `sub_service_id` (SSxxyy — first 2 digits after SS = category), `service_id`, `sub_service_name`, `base_annual_fee_inr`, `is_recurring`, `is_entry_service`, `is_statutory`, `relevance_trigger` |
| `clients` | 50 (46 Active) | `client_id`, `client_name`, `industry`, `entity_type`, `city`, `annual_turnover_band`, `onboarded_date`, `relationship_owner`, `status` |
| `engagements` | 228 | `engagement_id`, `client_id` → clients, `sub_service_id` → sub_services, `start_date`, `annual_fee_inr`, `billing_frequency`, `status` (Active/Lapsed) |
| `leads` | 80 | `lead_id`, ~20 chatbot/derived/internal fields (see §5), several nullable by design |
| `social_posts` | 87 | `post_id`, `post_date`, `platform`, `service_category`, `sub_service_id`, `reach`, `impressions`, `engagements`, `link_clicks`, `saves`, `is_paid`, `spend_inr` |

`sub_services.is_statutory` is the single most important column in the schema — it's what separates a compliance warning (credible, gets read) from a sales pitch (doesn't).

### 4.2 Views

- **`v_client_service_matrix`** — every client left-joined to their engagements. Keeps clients with zero engagements visible.
- **`v_category_alignment`** — one row per category with social/demand/revenue rollups and precomputed `attention_share_pct`, `lead_share_pct`, `revenue_share_pct`, `alignment_gap`. Drives Module 4's category-level view and Module 1's revenue chart.
- **`v_subservice_alignment`** — one row per sub-service with `penetration_pct` (share of active clients holding it) and `theoretical_headroom_inr`. Drives Module 1's heatmap. Note: this view does **not** compute `attention_share_pct`/`revenue_share_pct`/`alignment_gap` at sub-service level — that's computed application-side in `lib/alignment.ts` (see §8.2), because the SQL view predates the sub-service-level alignment requirement.

### 4.3 Row Level Security (added during this build, not in the original schema)

```sql
alter table <each of the 6 tables> enable row level security;
create policy "public read" on <table> for select using (true);
```

No write policies exist anywhere — the pilot is strictly read-and-recommend, per scope.

---

## 5. Data dictionary summary

Full detail in `docs/DATA_DICTIONARY.md`; the load-bearing facts:

- **Leads table field provenance** is tagged CHATBOT / DERIVED / INTERNAL, because the leads schema was reverse-engineered from a not-yet-built chatbot spec (`docs/CHATBOT_SPEC.md`, roadmap item). Partial chatbot sessions leave `annual_turnover_band`, `urgency`, `existing_ca_status`, `preferred_contact_mode`, `preferred_contact_time`, and `notes` blank. New leads have blank `last_contact_date` and `assigned_to`. The UI never renders these as bare cells — see §9.
- **Chatbot-completion finding** (verified against the actual CSV, matches the doc exactly): of 80 leads, 30 are `Complete` chatbot sessions (7 converted, 23%), 12 are `Partial` (0 converted — a real, if small-sample, finding), 38 are `NA`/non-chatbot (12 converted, 32%). This directly motivated the Module 3 rule: partial-capture leads get a phone-call recommendation, never email.
- **Turnover bands:** `Under 50L`, `50L - 2Cr`, `2Cr - 10Cr`, `10Cr+`, `NA (Individual)` — note the literal CSV format uses a spaced hyphen (`50L - 2Cr`), not the en-dash shorthand (`50L–2Cr`) used in prose in `PRD.md`/`DATA_DICTIONARY.md`. All code matches on the literal CSV strings.

---

## 6. Application data layer

- **`lib/types.ts`** — hand-written TypeScript interfaces for every table row and view row, kept in sync with `schema.sql` manually (no Supabase codegen was set up for this pilot).
- **`lib/queries.ts`** — one typed async function per table/view (`getClients()`, `getLeads()`, `getEngagements()`, `getSubServices()`, `getServiceCategories()`, `getSocialPosts()`, `getClientServiceMatrix()`, `getCategoryAlignment()`, `getSubServiceAlignment()`), each using Supabase's `.returns<T[]>()` for lightweight typing without full codegen, and throwing a labeled error if the query fails.
- **`lib/serviceMix.ts`** — `buildClientServiceSummaries()` computes, per client, the set of currently-held sub-service IDs, categories, and total active annual fee, counting **only `status === "Active"` engagements** (a Dormant client's engagements are `Lapsed` and correctly excluded from "held"). `averageServicePenetration()` derives the headline 4.8-of-30 / 2.9-of-6 KPI from this.

---

## 7. Module 1 — Client & Lead Dashboard (no AI)

**Routes:** `/` (Overview), `/clients`, `/leads`.

- **Overview KPIs:** Active clients (46 of 50), Total annual recurring fee value (sum of `annual_fee_inr` where engagement `status = Active` **and** `billing_frequency = Annual` — one-time fees are deliberately excluded from a "recurring" figure), Open leads (`status` not in `{Converted, Lost}`), Service penetration (the 4.8-of-30 vs 2.9-of-6 headline card, visually highlighted with the app's one warm accent color).
- **Charts:** Revenue-by-category (single-hue horizontal bar, sorted by value since category has no natural order); the 6×5 sub-service penetration heatmap (sequential blue fill by `penetration_pct`, statutory sub-services get a warm ring marker + legend entry); clients-by-industry (sorted by count) and clients-by-turnover-band (kept in band order, since turnover is ordinal); lead funnel (bar by pipeline stage, plus a small table of per-category conversion rate sourced straight from `v_category_alignment`).
- **`/clients`:** filterable (industry, entity type, city, turnover band, status, owner, **sub-service held**, **sub-service missing**) sortable table; row click opens a drawer showing full client detail and every currently-held sub-service with its category/date/fee. The missing-sub-service filter is what turns this screen into a prospecting list.
- **`/leads`:** filterable (category, sub-service, status, source, urgency, capture method, chatbot completion, enquiry date range) table. Rows where the lead is open (`New`/`Contacted`/`Qualified`) and untouched 14+ days (by `last_contact_date`, falling back to `enquiry_date` for never-contacted leads) get a warm-tinted highlight row.
- **Blank-field handling (a hard requirement, not a nicety):** every table cell that can be blank renders a muted "Not captured" chip via `<FieldValue>`/inline chip logic, never an empty `<td>`. Partial chatbot sessions get a distinct warm "Partial capture" chip instead of the neutral "Complete"/method chip.

---

## 8. Module 2 & the shared reasoning behind Modules 2–4

Modules 2, 3, and 4 all follow the same two-stage shape: **deterministic computation first, AI second.** The deterministic stage never touches the network; it's pure TypeScript over the already-fetched Supabase data. The AI stage is opt-in per row/lead/category via the `<AiPanel>` component.

### 8.1 Module 2 — Upsell / Cross-sell Engine

**Route:** `/upsell`. **Logic:** `lib/upsell.ts`.

Rules are matched by **sub-service ID**, not by name-string matching, because the PRD's shorthand names ("ITR Filing") don't always match the catalogue's actual `sub_service_name` ("Income Tax Return Filing") — ID matching is robust to that wording gap. Rules only evaluate `status === "Active"` clients.

**Statutory rules (High priority — compliance exposures, not sales pitches):**

| Rule | Condition | Missing sub-service (ID) |
|---|---|---|
| R1 | Holds ITR Filing (`SS0101`) | Advance Tax Planning (`SS0102`) |
| R2 | Holds GST Returns (`SS0202`) and turnover band is `2Cr - 10Cr` or `10Cr+` | GST Annual Return & Reconciliation (`SS0203`) |
| R3 | Entity is Private Limited or LLP | ROC Annual Filings (`SS0403`) |
| R4 | Entity is Private Limited | Statutory Audit (`SS0501`) |
| R5 | Turnover band is `2Cr - 10Cr` or `10Cr+` | Tax Audit u/s 44AB (`SS0502`) |
| R6 | Holds Monthly Books Closure (`SS0301`) and entity is Pvt Ltd/LLP | Financial Statement Preparation (`SS0302`) |
| R7 | Entity is Private Limited or LLP | DIN/DSC & Statutory Registers (`SS0404`) |
| R8 | Turnover `10Cr+` and holds GST Returns | E-invoicing & E-way Bill Setup (`SS0204`) |

**Commercial rules (Medium priority):**

| Rule | Condition | Missing sub-service |
|---|---|---|
| R9 | Holds ≥1 of 5 Virtual CFO sub-services but <3 | Each remaining VCFO sub-service not held (can fire multiple rows per client) |
| R10 | Turnover `10Cr+`, holds 0 VCFO sub-services | Budgeting & Forecasting (`SS0601`) only, as the entry point |
| R11 | Holds Monthly Books Closure, not Payroll | Payroll Processing (`SS0303`) |
| R12 | Industry is Manufacturing / Retail & Trading / Logistics, not Stock Audit | Stock & Inventory Audit (`SS0504`) |
| R13 | Onboarded 18+ months ago, holds <3 of 30 sub-services total | **Not a specific-service opportunity** — surfaced as a separate "under-penetrated, long-tenure account" flag/callout, since it has no single missing service or fee to attach to a table row |

**Indicative annual fee** = the target sub-service's catalogue `base_annual_fee_inr` (unscaled by turnover band), matching the literal field name in `AI_PROMPTS.md`'s data-context template.

**UI:** summary strip (total/statutory/commercial counts and value), sortable ranked table, "Statutory only" toggle, row-click drawer with rule detail + the `<AiPanel module="upsell">`.

### 8.2 Module 4 — Social vs Sales Alignment (documented here for logical grouping; UI in §10)

**Logic:** `lib/alignment.ts`. Computes `attention_share_pct`, `revenue_share_pct`, `alignment_gap = attention − revenue` **at both category level** (straight from `v_category_alignment`) **and sub-service level** (computed here, since the SQL view doesn't provide it — totals are derived by summing all 30 `v_subservice_alignment` rows' own `reach`/`revenue`).

**Four-way classification**, checked in this priority order:

1. **Untapped demand** — `engagement_rate_pct > 1.3 × average` **and** `leads < average`. Checked first because it's independent of (and can coexist with) a small attention/revenue gap — this is exactly how Virtual CFO is classified in the seed data (gap only +8.1, well inside the ±10 threshold, but flagged anyway because of its outsized engagement rate and thin lead volume).
2. **Over-invested** — `gap > +10` (percentage points; the PRD's `+0.10` fractional threshold expressed in the view's percentage units).
3. **Under-served** — `gap < −10`.
4. **Dormant** — `posts ≤ 0.5 × average` and `leads ≤ 0.5 × average` (low effort, low return, and not already caught above).
5. **Aligned** — fallback.

This classification was manually checked against every finding planted in `DATA_DICTIONARY.md` (Incorporation over-invested at +42.3 in the live data, Audit/GST/Bookkeeping under-served, Virtual CFO untapped demand at 8.9%-ish engagement/6 leads) and matches on all of them.

---

## 9. Module 3 — Lead Conversion Planner

**Route:** `/leads/conversion`. **Logic:** `lib/leadScore.ts`.

Scores **open leads only** (`New`/`Contacted`/`Qualified`) out of 100, five weighted components:

| Component | Weight | Formula |
|---|---|---|
| Value | 25 | `25 × (estimated_value_inr / max_open_lead_value)` |
| Urgency | 20 | `Immediate (deadline within 15 days)` → 20, `This month` → 14, `This quarter` → 7, `Just exploring` → 2, blank → 5 |
| Stage | 20 | `Qualified` → 20, `Contacted` → 12, `New` → 8 |
| Recency | 20 | Full 20 under 7 days since last contact (or since enquiry, for never-contacted leads); linear decay to 0 at 30 days |
| Source & capture | 15 | `Referral` 15, `Walk-in` 13, `Website Direct` 11, `LinkedIn` 10, `Google Search` 8, `Instagram` 6; **−5** if `chatbot_completion === "Partial"` |

Buckets: **Hot** ≥70, **Warm** 40–69, **Cold** <40.

**Two override rules, applied independently of the score:**

- `existing_ca_status` containing "considering a switch" (the live data's actual string is `"Have a CA, considering a switch"`, matched via substring rather than the doc's shorter paraphrase) → surfaced in a separate "Switching leads" section regardless of bucket, because the objection there is transition risk, not price.
- `consent_to_contact === "No"` → **excluded from every Hot/Warm/Cold/stale/partial list entirely**, shown only in a final "Excluded from outreach — no consent to contact" list with names, so the reason is visible rather than the lead silently vanishing.

**UI:** Hot/Warm/Cold Kanban-style columns with per-bucket pipeline value, a Switching-leads callout, a Stale-leads callout (open, 14+ days untouched, highest value first), a Partial-captures callout, the excluded-leads note, and a lead-detail drawer showing the full 5-component score breakdown as horizontal bars plus `<AiPanel module="conversion">`.

---

## 10. Module 4 UI (see §8.2 for the underlying logic)

**Route:** `/alignment`.

- **Attention vs revenue** — grouped bar, one color per metric (blue = share of reach, orange = share of revenue), fixed category order on the x-axis (never re-sorted by value, so a category's bar position is stable across filters/reloads).
- **Engagement rate vs lead volume** — scatter, one point per category, colored by a fixed category→hue mapping (see §12), **each point directly labeled with its category name** (a deliberate accessibility choice — see §12 for why), with the "untapped demand" quadrant shaded and labeled via a `ReferenceArea`.
- **Alignment table** — category rows expand (click) to their 5 sub-service rows, each showing reach/revenue share, gap, classification chip, leads, and conversion rate. This is what turns "Virtual CFO is untapped" into "post about Fund-raise Support and Business Valuation specifically."
- **Monthly trend** — deliberately **two separate line charts** (Engagements, Leads) sharing one category filter and one x-axis, rather than a single dual-axis chart. This was a conscious design decision: engagements run in the thousands per category while leads run in single/double digits, and a shared-scale dual-axis chart would either flatten the leads line to invisibility or fabricate a visual correlation that isn't backed by the data (see §12, dataviz anti-patterns).
- A fixed on-screen note: *"Correlation, not attribution — there is no UTM or click-path tracking, so no post can be credited with any specific lead."*
- `<AiPanel module="alignment">` at the bottom, fed by `lib/alignmentContext.ts`'s data-context builder (see §13).

---

## 11. Real bugs found and fixed during the build

These are substantive engineering findings, not cosmetic fixes — worth a line in the report's "challenges encountered" section.

### 11.1 Supabase RLS silently blocked all base-table reads

The schema as originally written created 6 tables with Postgres Row Level Security implicitly enabled and **zero policies** — meaning the anon key (the only key this app is allowed to use, per the no-auth pilot scope) got a default-deny on every direct table query, returning `[]` with no error. The two SQL views worked fine, because views run under the table owner's privileges and bypass RLS. This was caught in Phase 0 by directly querying the REST API with `curl` before any application code was written — comparing "6 rows from the view" against "0 rows from the raw table" surfaced the discrepancy immediately. Fixed by adding `enable row level security` + a permissive `for select using (true)` policy to all 6 tables, applied to the live project and folded into `schema.sql` for reproducibility.

### 11.2 Next.js was statically prerendering the entire dashboard at build time

`npm run build` initially reported all 6 data-fetching routes as `○ (Static)` — meaning Next.js's App Router had determined no request-time inputs were used and had baked the Supabase query results into the build output as a permanent static snapshot. For a dashboard whose entire premise is "live data from Supabase," this would have meant the deployed app never reflected new data without a full redeploy. Fixed by adding `export const dynamic = "force-dynamic"` to all 6 page components; a rebuild confirmed all 6 now show `ƒ (Dynamic)`, server-rendered per request. `/about` (static content, no data fetch) correctly stays static.

### 11.3 Recharts XAxis silently dropping category tick labels

The 6-category bar chart and the 6-month trend chart were both rendering with 2–4 of their axis labels missing — not a data bug, but Recharts' default tick-collision-avoidance quietly dropping labels it judged would overlap in a narrow container. Fixed with `interval={0}` (force every tick to render) combined with angled labels on the narrower chart, verified by re-reading the rendered accessibility tree rather than trusting a screenshot.

### 11.4 Mobile layout: sidebar didn't collapse

The initial fixed 224px sidebar had no responsive behavior, so on a 375px viewport it consumed ~60% of the screen width and forced horizontal clipping on every page. Fixed with a `hidden md:flex` desktop sidebar plus a new `MobileNav` client component (hamburger button + slide-over drawer, reusing the same nav item list from a shared `lib/navItems.ts`) for viewports below the `md` breakpoint. Verified visually at 375×812.

### 11.5 Server/Client Component prop-passing errors

Multiple instances of passing a `columns` array containing functions (accessor/sortValue callbacks) from a Server Component directly into the Client Component `<DataTable>` — which fails at the React Server Components boundary, since functions aren't serializable across it. Fixed by introducing small dedicated Client Component wrappers (e.g. `CategoryConversionTable.tsx`) that define the column functions internally and only accept plain data as props.

---

## 12. Design system

Deliberately not a startup dashboard: restrained, professional-services palette, no gradients/glassmorphism/emoji in the chrome, per the project's own style guidelines.

- **UI chrome tokens** (Tailwind v4 `@theme` block in `app/globals.css`): a deep navy scale (`--color-navy-950`…`600`, primary accent for nav/headers/buttons/links), a slate neutral scale (text/borders/surfaces), and **one** warm accent scale (`--color-warm-*`, amber-toned) reserved for alerts, statutory markers, and staleness — matching the brief's "one warm highlight" instruction literally.
- **Chart colors** (`lib/chartColors.ts`, kept separate from the CSS tokens because Recharts sets `fill`/`stroke` as raw SVG attributes that don't resolve CSS custom properties): a fixed category→hue mapping (Taxation=blue, GST=orange, Bookkeeping=aqua, Incorporation=yellow, Audit=magenta, Virtual CFO=green) assigned by category **identity**, never by sort rank — so a category keeps its color no matter how a chart re-sorts or filters. This 8-hue-capable, CVD-validated categorical palette (and the sequential-blue heatmap ramp, and the diverging blue↔red pair for alignment gaps) came from a standard dataviz accessibility methodology consulted before writing any chart code; the scatter chart's 6-point spatial layout is the one chart form where that palette's accessibility guarantee doesn't fully extend past 3 series, which is why every scatter point is also directly text-labeled rather than relying on hue alone.
- **Money:** `formatINR()` — `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0})`, giving the correct lakh/crore grouping (`₹8,10,000`) for free from the `en-IN` locale.
- **Dates:** `formatDate()` — deliberately **not** `Intl.DateTimeFormat`, because `en-GB`'s ICU data abbreviates September as "Sept" (4 letters) while every other month is 3 letters; a hand-rolled formatter with a fixed `MONTHS` array guarantees a strict `DD MMM YYYY`. Also formats in UTC explicitly, since Postgres `date` columns arrive as midnight-UTC ISO strings and formatting them in the browser's local timezone can silently shift the displayed day by one.
- **Shared components:** `KpiCard`, `DataTable` (generic, sortable, typed via `Column<T>[]`), `SectionHeading`, `EmptyState`, `Chip`/`FieldValue` (the "Not captured" mechanism), `Drawer` (slide-over detail panel, reused by Clients/Upsell/Conversion), `Skeleton`/`PageSkeleton` (loading states).

---

## 13. AI integration details

### 13.1 The two-part prompt contract

Every AI panel sends exactly: **system instruction** (fixed per module, in `lib/aiPrompts.ts`, transcribed verbatim from `docs/AI_PROMPTS.md`) + **locked data context** (server-assembled string, shown to the user in a collapsed read-only panel, never editable) + **user instruction** (an editable textarea, pre-filled with a module default; if the user clears it, the server falls back to the default rather than sending an empty instruction).

### 13.2 Data context builders

One per module, each producing the exact field-by-field block specified in `AI_PROMPTS.md`:

- `lib/upsellContext.ts` — client profile, currently-held sub-services with fee/date, the opportunity detail (missing service, statutory flag, trigger text, rule fired), related services in the same category, and a peer benchmark (clients with the same entity type + turnover band, how many hold this service, firm-wide penetration %).
- `lib/conversionContext.ts` — full lead detail, the 5-component score breakdown, a benchmark (conversion rate for this specific sub-service interest and for the category), and an explicit `FIELDS NOT CAPTURED` list (or "none") so the model knows exactly what to ask on the first call.
- `lib/alignmentContext.ts` — per-category social/demand/revenue/share/gap block for all 6 categories, sub-service-level detail **only for the 3 most misaligned categories** (by absolute gap), and firm totals.

### 13.3 Route handler (`app/api/generate/route.ts`)

`POST` body: `{ module, dataContext, instruction }`. Calls `https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent`, using `system_instruction` for the fixed framing and the data context + instruction concatenated into the user `contents`. **Never sends `temperature`, `top_p`, or `top_k`** (deprecated/ignored on current Gemini models, per project rule). Explicit handling, each with a distinct readable message and correct HTTP status: missing API key (500), Gemini 429 rate limit (429, passed through), network failure/timeout via a 25-second `AbortController` (504), non-OK Gemini response (502 with truncated upstream detail), and empty candidate text (502).

### 13.4 `<AiPanel>` client component

Four visible states — idle, loading (spinner + "Generating…"), error (readable message, red panel), result — plus a collapsible data-context viewer and a copy-to-clipboard button. Gemini's fixed-heading output format (e.g. `PITCH ANGLE` / `TALKING POINTS` / …) is parsed by `lib/parseAiOutput.ts` into labeled sections and rendered with proper visual hierarchy rather than as one undifferentiated text block.

### 13.5 Verification performed

All three modules' Generate buttons were exercised live against the real Gemini API during the build (not mocked) — confirmed correct system-instruction framing, correct section-heading format, and content that was specific to the actual client/lead/category data passed in (e.g., a real generated Upsell recommendation correctly cited "Terrace Solutions... Private Limited... mandatory audit requirement under the Companies Act"; a real generated Alignment strategy correctly said "Post 4 times more about Tax Audit u/s 44AB" — a specific sub-service, not a vague category, matching the system instruction's explicit rule).

---

## 14. Known deviations between the planning docs and the actual data

Flagged deliberately rather than silently patched over, per this project's own working rule ("if something in the data or schema doesn't match what a doc describes, point it out and ask rather than silently reconciling it").

1. **String-format mismatches** between prose docs and the literal CSV values — turnover bands (`2Cr - 10Cr` in data vs. `2Cr–10Cr` in prose), urgency (`Immediate (deadline within 15 days)` vs. `Immediate`), `existing_ca_status` wording (`Have a CA, considering a switch` vs. `Have one, considering a switch`), contact mode (`Phone call` vs. `Phone`). All application logic matches on the literal data strings; this is noted so it isn't mistaken for a bug later.
2. **Upsell opportunity totals.** `DATA_DICTIONARY.md` states rules R1–R8 should surface "roughly 70 statutory opportunities worth about ₹16.79L." Implementing R1–R8 exactly as `PRD.md`'s table specifies, against the actual committed seed data, yields **100 opportunities worth ₹19,75,000**. Cross-checked against `data/generate_dummy_data.py`: the gap-planting logic there is probabilistic (weighted `chance()` calls per client), not a deterministic encoding of the R1–R8 rule set, so the doc's figure reads as an earlier or approximate estimate rather than ground truth for the final generated CSVs. The rule *logic* was verified correct rule-by-rule against the raw CSVs (via an independent Python script) before any UI was built on top of it.
3. **`v_subservice_alignment` doesn't precompute alignment shares/gap.** Unlike `v_category_alignment`, the sub-service view only provides `penetration_pct` and raw counts; attention/revenue share and gap at sub-service level had to be computed application-side (§8.2), since the SQL predates that requirement being made explicit at the sub-service level.

---

## 15. Environment & setup

`.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # browser-safe, read-only, RLS-gated
GEMINI_API_KEY=...                     # server-side only, never NEXT_PUBLIC_
GEMINI_MODEL=gemini-3.5-flash-lite
```

Local dev: `npm run dev` (Turbopack). Production check performed locally: `npm run build` (clean) → `npm run start`. Lint: `npm run lint` (ESLint 9, zero warnings at handover).

**Not yet done:** Vercel deployment (needs the project owner's Vercel account — the same 3 env vars need setting there), git initialization/first commit.

---

## 16. Development process (for a report "methodology" section)

Built in the phased order set out in `docs/BUILD_PLAN.md`, verified at each checkpoint before moving on:

1. **Phase 0** — environment setup (Node/Homebrew installed from scratch mid-project), Supabase project creation, schema + CSV import, RLS bug found and fixed, Gemini key obtained and sanity-tested via raw `curl` against the real API before any app code existed. Checkpoint: a raw-JSON page proving both Supabase views returned the right row counts (6, 30) with real numbers matching the planted findings.
2. **Phase 1** — Next.js scaffold, design tokens, shared components, all 6 routes reachable.
3. **Phase 2** — Module 1 fully built and checkpointed (4.8-of-30 vs 2.9-of-6 confirmed live).
4. **Phase 3** — AI plumbing built once (route handler + `<AiPanel>`), sanity-tested against the live Gemini API via `curl` before wiring into any real page.
5. **Phase 4** — Modules 2 and 3, each rule/score independently verified against raw CSV data via standalone Python scripts before being trusted in the UI.
6. **Phase 5** — Module 4, including the dataviz-accessibility pass and the deliberate two-chart (not dual-axis) decision for the monthly trend.
7. **Phase 6** — polish: loading skeletons, the static-rendering bug found and fixed, the mobile-nav bug found and fixed, an About page, full production build and lint verification.

Every module's AI Generate button and every chart was manually exercised in a live browser session against the real Supabase project and the real Gemini API — not just code-reviewed — before being considered done.
