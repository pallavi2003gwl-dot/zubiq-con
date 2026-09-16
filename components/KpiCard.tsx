export function KpiCard({
  label,
  value,
  subvalue,
  highlight,
}: {
  label: string;
  value: string;
  subvalue?: string;
  /** Use sparingly — the one warm highlight, for the headline penetration-gap card. */
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        highlight ? "border-warm-700/30 bg-warm-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {subvalue ? (
        <p className={`mt-1 text-xs ${highlight ? "text-warm-800" : "text-slate-500"}`}>
          {subvalue}
        </p>
      ) : null}
    </div>
  );
}
