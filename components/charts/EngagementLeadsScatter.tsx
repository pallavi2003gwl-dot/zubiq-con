"use client";

import {
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColor, CHART_INK } from "@/lib/chartColors";
import type { CategoryAlignment } from "@/lib/alignment";

export function EngagementLeadsScatter({ data }: { data: CategoryAlignment[] }) {
  const avgLeads = data.reduce((s, d) => s + d.leads, 0) / data.length;
  const avgEngagement = data.reduce((s, d) => s + d.engagement_rate_pct, 0) / data.length;
  // Round domains up to clean steps rather than raw floating-point products (marks-and-anatomy.md).
  const maxLeads = Math.ceil((Math.max(...data.map((d) => d.leads)) * 1.15) / 5) * 5;
  const maxEngagement = Math.ceil(Math.max(...data.map((d) => d.engagement_rate_pct)) * 1.2);

  const points = data.map((d) => ({
    category: d.service_category,
    leads: d.leads,
    engagement_rate_pct: d.engagement_rate_pct,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ left: 8, right: 24, top: 16, bottom: 8 }}>
        <CartesianGrid stroke={CHART_INK.grid} />
        <ReferenceArea
          x1={0}
          x2={avgLeads}
          y1={avgEngagement}
          y2={maxEngagement}
          fill="#eda100"
          fillOpacity={0.08}
          stroke="none"
        >
          <Label value="Untapped demand" position="insideTopLeft" fontSize={11} fill="#92400e" offset={8} />
        </ReferenceArea>
        <XAxis
          type="number"
          dataKey="leads"
          name="Leads"
          domain={[0, maxLeads]}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          label={{ value: "Lead volume", position: "insideBottom", offset: -4, fontSize: 11, fill: CHART_INK.secondary }}
        />
        <YAxis
          type="number"
          dataKey="engagement_rate_pct"
          name="Engagement rate"
          unit="%"
          domain={[0, maxEngagement]}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: CHART_INK.muted }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ strokeDasharray: "0" }}
          formatter={(value, name) => [name === "Engagement rate" ? `${value}%` : value, name]}
          contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }}
        />
        <Scatter data={points} fill="#2a78d6">
          {points.map((p) => (
            <Cell key={p.category} fill={categoryColor(p.category)} r={7} />
          ))}
          <LabelList
            dataKey="category"
            position="top"
            style={{ fontSize: 11, fill: CHART_INK.secondary }}
          />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
