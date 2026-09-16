"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_ORDER, CHART_INK } from "@/lib/chartColors";
import type { CategoryAlignment } from "@/lib/alignment";

const ATTENTION_COLOR = "#4f46e5";
const REVENUE_COLOR = "#eb6834";

export function AttentionRevenueBar({ data }: { data: CategoryAlignment[] }) {
  const byCategory = new Map(data.map((d) => [d.service_category, d]));
  const rows = CATEGORY_ORDER.map((cat) => {
    const row = byCategory.get(cat);
    return {
      category: cat,
      "Share of reach": row?.attention_share_pct ?? 0,
      "Share of revenue": row?.revenue_share_pct ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} margin={{ left: 0, right: 16, top: 8, bottom: 24 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis
          dataKey="category"
          interval={0}
          angle={-25}
          textAnchor="end"
          height={50}
          tick={{ fontSize: 10, fill: CHART_INK.secondary }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          unit="%"
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => `${value}%`}
          contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Share of reach" fill={ATTENTION_COLOR} radius={[4, 4, 0, 0]} barSize={18} />
        <Bar dataKey="Share of revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
