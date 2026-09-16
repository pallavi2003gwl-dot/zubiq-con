import { CATEGORY_ORDER, sequentialBlueStep } from "@/lib/chartColors";
import type { SubServiceAlignmentRow } from "@/lib/types";

// Sequential steps above this lightness need dark text; below, white text reads better.
const DARK_TEXT_THRESHOLD = 45;

export function PenetrationHeatmap({ rows }: { rows: SubServiceAlignmentRow[] }) {
  const byCategory = new Map<string, SubServiceAlignmentRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.service_category) ?? [];
    list.push(row);
    byCategory.set(row.service_category, list);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.sub_service_id.localeCompare(b.sub_service_id));
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[120px_repeat(5,1fr)] gap-1.5">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="contents">
              <div className="flex items-center text-xs font-medium text-slate-600">{category}</div>
              {(byCategory.get(category) ?? []).map((cell) => {
                const bg = sequentialBlueStep(cell.penetration_pct);
                const light = cell.penetration_pct < DARK_TEXT_THRESHOLD;
                const isStatutory = cell.is_statutory === "Yes";
                return (
                  <div
                    key={cell.sub_service_id}
                    title={`${cell.sub_service_name} — ${cell.penetration_pct}% of active clients (${cell.clients_holding}/${cell.active_clients})${
                      isStatutory ? ` · Statutory: ${cell.relevance_trigger}` : ""
                    }`}
                    className={`flex h-16 flex-col justify-between rounded-md px-2 py-1.5 ${
                      isStatutory ? "ring-2 ring-warm-600" : ""
                    }`}
                    style={{ backgroundColor: bg }}
                  >
                    <p
                      className={`truncate text-[11px] leading-tight ${
                        light ? "text-slate-700" : "text-white"
                      }`}
                    >
                      {cell.sub_service_name}
                    </p>
                    <p
                      className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}
                    >
                      {cell.penetration_pct}%
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-warm-600" /> Statutory
          sub-service
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-6 rounded-sm"
            style={{
              background: "linear-gradient(to right, #eef4fc, #0d366b)",
            }}
          />
          Low → high penetration
        </span>
      </div>
    </div>
  );
}
