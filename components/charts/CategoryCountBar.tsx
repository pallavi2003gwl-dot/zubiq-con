"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK } from "@/lib/chartColors";

interface Row {
  label: string;
  value: number;
}

/** Single-hue count bar chart. Sort by value only when categories are nominal
 * (no natural order); keep the given order for ordinal data like turnover bands. */
export function CategoryCountBar({
  data,
  sortByValue = true,
  height = 260,
}: {
  data: Row[];
  sortByValue?: boolean;
  height?: number;
}) {
  const rows = sortByValue ? [...data].sort((a, b) => b.value - a.value) : data;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: CHART_INK.secondary }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }} />
        <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
