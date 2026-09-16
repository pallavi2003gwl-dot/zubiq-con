const OUT_OF_SCOPE = [
  "The website chatbot itself — specified in docs/CHATBOT_SPEC.md as the roadmap design, not built here",
  "Google Sheets to Supabase sync via Apps Script",
  "Live social API integration (Meta Graph, LinkedIn)",
  "Authentication and role-based access",
  "Daily call-to-action feed",
  "Formal KPI target-setting framework",
  "Sending email or WhatsApp from inside the tool",
  "Any write path back to the database from the UI — this pilot is read-and-recommend only",
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">About this prototype</h1>
        <p className="mt-1 text-sm text-slate-500">
          Built as the pilot artefact for an AI Integration Project (AIM course, FORE School of Management).
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-900">The data is synthetic</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Every row in every table — clients, leads, engagements, social posts — is generated data. No real ZubiQ
          Consultants client information appears anywhere in this application. The structure mirrors what a
          Chartered Accountancy firm of this size would actually hold, and several data gaps (partial chatbot
          sessions, dormant clients, under-penetrated accounts) are planted deliberately so the tool has real
          findings to surface, not because the underlying business is real.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-900">AI runs on demand, never automatically</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          No AI call fires on page load, on mount, or on a data refresh. Every recommendation in the Upsell,
          Conversion, and Alignment modules sits behind an explicit Generate button. Each panel shows the exact,
          read-only data context sent to the model alongside an editable instruction box — nothing the model sees is
          hidden, and nothing it says is invented from outside that context. The Gemini API key lives server-side
          only, called from a single route handler; it never reaches the browser.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Everything operates at sub-service level</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          ZubiQ&apos;s six service categories are what the firm can already see in Excel. Every gap check, every
          statutory rule, and every AI recommendation in this tool checks the 30-row sub-service catalogue instead —
          that is the entire commercial argument for building a tool rather than a pivot table.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Out of scope for this pilot</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          These are roadmap items, deliberately not built here:
        </p>
        <ul className="mt-1 flex flex-col gap-1.5">
          {OUT_OF_SCOPE.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="text-slate-300">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
