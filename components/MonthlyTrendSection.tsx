"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FilterSelect } from "@/components/FilterSelect";
import { SectionHeading } from "@/components/SectionHeading";
import { CATEGORY_ORDER, CHART_INK } from "@/lib/chartColors";
import { buildMonthlyTrend } from "@/lib/monthlyTrend";
import type { Lead, SocialPost } from "@/lib/types";

function MiniLineChart({ data, dataKey, color, label }: { data: ReturnType<typeof buildMonthlyTrend>; dataKey: "engagements" | "leads"; color: string; label: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          <XAxis
            dataKey="label"
            interval={0}
            tick={{ fontSize: 10, fill: CHART_INK.muted }}
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} width={36} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: CHART_INK.grid }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendSection({ posts, leads }: { posts: SocialPost[]; leads: Lead[] }) {
  const [category, setCategory] = useState("");
  const data = useMemo(() => buildMonthlyTrend(posts, leads, category || null), [posts, leads, category]);

  return (
    <section>
      <SectionHeading
        title="Monthly trend"
        description="Engagements and leads per month. Two charts, not one dual-axis chart — the scales aren't comparable."
        action={
          <div className="w-48">
            <FilterSelect label="Category" value={category} onChange={setCategory} options={[...CATEGORY_ORDER]} />
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white shadow-sm p-4 sm:grid-cols-2">
        <MiniLineChart data={data} dataKey="engagements" color="#4f46e5" label="Engagements" />
        <MiniLineChart data={data} dataKey="leads" color="#eb6834" label="Leads" />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Correlation, not attribution — there is no UTM or click-path tracking, so no post can be credited with any
        specific lead.
      </p>
    </section>
  );
}
