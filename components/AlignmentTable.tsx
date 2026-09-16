"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Chip } from "@/components/Chip";
import type { AlignmentLabel, CategoryAlignment, SubServiceAlignment } from "@/lib/alignment";

const LABEL_TONE: Record<AlignmentLabel, "warm" | "navy" | "muted" | "critical"> = {
  "Over-invested": "warm",
  "Under-served": "critical",
  "Untapped demand": "navy",
  Dormant: "muted",
  Aligned: "muted",
};

function GapCell({ gap }: { gap: number }) {
  const sign = gap > 0 ? "+" : "";
  const color = gap > 0 ? "text-warm-700" : gap < 0 ? "text-red-700" : "text-slate-500";
  return <span className={color}>{sign}{gap}</span>;
}

export function AlignmentTable({
  categories,
  subServicesByCategory,
}: {
  categories: CategoryAlignment[];
  subServicesByCategory: Map<string, SubServiceAlignment[]>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(category: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5 text-left">Category / sub-service</th>
            <th className="px-4 py-2.5 text-right">Reach share</th>
            <th className="px-4 py-2.5 text-right">Revenue share</th>
            <th className="px-4 py-2.5 text-right">Gap</th>
            <th className="px-4 py-2.5 text-left">Label</th>
            <th className="px-4 py-2.5 text-right">Leads</th>
            <th className="px-4 py-2.5 text-right">Conv. rate</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const isOpen = expanded.has(cat.service_category);
            const children = subServicesByCategory.get(cat.service_category) ?? [];
            return (
              <Fragment key={cat.service_id}>
                <tr
                  onClick={() => toggle(cat.service_category)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="flex items-center gap-1.5 px-4 py-2.5 font-medium text-slate-900">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {cat.service_category}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{cat.attention_share_pct}%</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{cat.revenue_share_pct}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <GapCell gap={cat.alignment_gap} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Chip tone={LABEL_TONE[cat.label]}>{cat.label}</Chip>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{cat.leads}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{cat.conversion_rate_pct}%</td>
                </tr>
                {isOpen
                  ? children.map((s) => (
                      <tr key={s.sub_service_id} className="border-b border-slate-50 bg-slate-50/50">
                        <td className="py-2 pl-10 pr-4 text-slate-600">{s.sub_service_name}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{s.attentionSharePct}%</td>
                        <td className="px-4 py-2 text-right text-slate-500">{s.revenueSharePct}%</td>
                        <td className="px-4 py-2 text-right">
                          <GapCell gap={s.alignmentGap} />
                        </td>
                        <td className="px-4 py-2">
                          <Chip tone={LABEL_TONE[s.label]}>{s.label}</Chip>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-500">{s.leads}</td>
                        <td className="px-4 py-2 text-right text-slate-500">
                          {s.leads > 0 ? `${Math.round((s.converted / s.leads) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
