import type { CategoryAlignmentRow, SubServiceAlignmentRow } from "./types";

export type AlignmentLabel = "Over-invested" | "Under-served" | "Untapped demand" | "Dormant" | "Aligned";

const GAP_THRESHOLD = 10; // percentage points, matches PRD's +/-0.10 in fractional share units

export interface CategoryAlignment extends CategoryAlignmentRow {
  label: AlignmentLabel;
}

export interface SubServiceAlignment extends SubServiceAlignmentRow {
  attentionSharePct: number;
  revenueSharePct: number;
  alignmentGap: number;
  label: AlignmentLabel;
}

function classify(params: {
  gap: number;
  engagementRatePct: number;
  leads: number;
  posts: number;
  avgEngagementRatePct: number;
  avgLeads: number;
  avgPosts: number;
}): AlignmentLabel {
  const { gap, engagementRatePct, leads, posts, avgEngagementRatePct, avgLeads, avgPosts } = params;

  // Untapped demand checked first: the audience responds but is rarely asked to act —
  // the most actionable finding, independent of whether the attention/revenue gap itself
  // crosses the over/under threshold (e.g. Virtual CFO in the seed data).
  if (engagementRatePct > avgEngagementRatePct * 1.3 && leads < avgLeads) {
    return "Untapped demand";
  }
  if (gap > GAP_THRESHOLD) return "Over-invested";
  if (gap < -GAP_THRESHOLD) return "Under-served";
  if (posts <= avgPosts * 0.5 && leads <= avgLeads * 0.5) return "Dormant";
  return "Aligned";
}

export function classifyCategoryAlignment(rows: CategoryAlignmentRow[]): CategoryAlignment[] {
  const avgEngagementRatePct = average(rows.map((r) => r.engagement_rate_pct));
  const avgLeads = average(rows.map((r) => r.leads));
  const avgPosts = average(rows.map((r) => r.posts));

  return rows.map((row) => ({
    ...row,
    label: classify({
      gap: row.alignment_gap,
      engagementRatePct: row.engagement_rate_pct,
      leads: row.leads,
      posts: row.posts,
      avgEngagementRatePct,
      avgLeads,
      avgPosts,
    }),
  }));
}

export function classifySubServiceAlignment(rows: SubServiceAlignmentRow[]): SubServiceAlignment[] {
  const totalReach = rows.reduce((s, r) => s + r.reach, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const avgEngagementRatePct = average(rows.map((r) => r.engagement_rate_pct));
  const avgLeads = average(rows.map((r) => r.leads));
  const avgPosts = average(rows.map((r) => r.posts));

  return rows.map((row) => {
    const attentionSharePct = totalReach > 0 ? (row.reach / totalReach) * 100 : 0;
    const revenueSharePct = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
    const alignmentGap = round1(attentionSharePct - revenueSharePct);
    return {
      ...row,
      attentionSharePct: round1(attentionSharePct),
      revenueSharePct: round1(revenueSharePct),
      alignmentGap,
      label: classify({
        gap: alignmentGap,
        engagementRatePct: row.engagement_rate_pct,
        leads: row.leads,
        posts: row.posts,
        avgEngagementRatePct,
        avgLeads,
        avgPosts,
      }),
    };
  });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
