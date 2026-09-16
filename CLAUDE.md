# Instructions for Claude Code

Read `docs/PRD.md` before writing any code. Read `docs/DATA_DICTIONARY.md` before
writing any query. Read `docs/AI_PROMPTS.md` before touching the Gemini integration.

## Ground rules

1. **Build in the order set out in `docs/BUILD_PLAN.md`.** Do not start Module 3
   before Module 2 renders correctly with real data from Supabase. Each phase ends
   with a working screen.
2. **No AI call fires on page load, on mount, or on any data refresh.** Every AI
   output is behind an explicit Generate button that the user clicks.
3. **The Gemini API key never reaches the browser.** All model calls go through a
   Next.js route handler at `/app/api/generate/route.ts`. Do not use
   `NEXT_PUBLIC_GEMINI_API_KEY`.
4. **Do not invent data.** If the dashboard needs a number, compute it from the
   tables in Supabase. No hardcoded totals, no placeholder arrays left in the final code.
5. **Work at sub-service level, not category level.** Category-level analysis is what
   the firm can already do in Excel. Every gap check, every penetration number, and
   every AI recommendation operates on the 30-row `sub_services` catalogue. Categories
   exist only for rolling up and for the top level of a drill-down.
6. **Handle blank fields.** Partial chatbot sessions leave several lead columns empty and
   New leads have no contact history. Nothing may crash, and nothing may render as a bare
   blank cell. Show "Not captured" or a Partial chip.
7. **Do not pass `temperature`, `top_p`, or `top_k`** to the Gemini API. These are
   deprecated on current models and will throw or be ignored.
8. **Scope discipline.** The pilot is exactly four modules. Do not add authentication,
   role management, a chatbot, Google Sheets sync, email sending, or PDF export unless
   explicitly asked. Those are roadmap items, not pilot items.

## Prompt box contract

Every AI section on screen has two parts. This split is not optional.

- **Data context (locked, read-only, shown in a collapsed grey panel).** Built by the
  app from real query results. The user can see it but cannot edit or delete it.
- **Instruction (editable textarea, pre-filled with a default from `docs/AI_PROMPTS.md`).**
  The user may rewrite this freely.

On Generate, the server composes: `system instruction` + `locked data context` +
`user instruction`, in that order. If the user clears the instruction box, fall back
to the default rather than sending an empty instruction.

## Code conventions

- TypeScript throughout. No `any` unless there is a comment justifying it.
- Server Components for data fetching. Client Components only where interactivity
  needs it (filters, prompt boxes, generate buttons, charts).
- One Supabase client helper in `lib/supabase.ts`. Do not instantiate clients inline.
- Money renders as Indian format: `₹8,10,000`. Write one `formatINR()` helper in
  `lib/format.ts` and use it everywhere.
- Dates render as `DD MMM YYYY`.
- Every AI output panel needs three visible states: idle, loading, error. An API
  failure must show a readable message, not a blank card or a silent console log.

## Visual direction

This is a professional services firm, not a startup dashboard. Aim for calm and
legible: a restrained palette (deep navy or slate as the accent, white surfaces,
one warm highlight for alerts), generous whitespace, clear table typography.
Avoid neon gradients, glassmorphism, and emoji in the UI chrome.

## Definition of done for the pilot

- All four modules load real data from Supabase with no console errors.
- Each AI module generates a sensible recommendation in under ~10 seconds.
- Filters on Module 1 work and update every dependent card.
- Deploys cleanly to Vercel with environment variables set.
- Screenshots of all four modules can be taken for the project report appendix.
