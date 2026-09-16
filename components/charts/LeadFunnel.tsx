"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK } from "@/lib/chartColors";

const STAGE_ORDER = ["New", "Contacted", "Qualified", "Converted", "Lost"] as const;

export function LeadFunnel({ counts }: { counts: Record<string, number> }) {
  const data = STAGE_ORDER.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 12, fill: CHART_INK.secondary }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          width={28}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }} />
        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
