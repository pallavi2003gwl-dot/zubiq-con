"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK } from "@/lib/chartColors";
import { formatINR } from "@/lib/format";

interface Row {
  service_category: string;
  revenue: number;
}

export function RevenueByCategoryBar({ data }: { data: Row[] }) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatINR(v)}
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="service_category"
          width={100}
          tick={{ fontSize: 12, fill: CHART_INK.secondary }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => formatINR(Number(value))}
          contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }}
        />
        <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
