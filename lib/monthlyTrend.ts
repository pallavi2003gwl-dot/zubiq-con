import type { Lead, SocialPost } from "./types";
import { monthLabel } from "./format";

export interface MonthlyPoint {
  month: string;
  label: string;
  engagements: number;
  leads: number;
}

// Fixed to the analysis window in docs/DATA_DICTIONARY.md (01 Apr 2026 - 15 Sep 2026)
// rather than derived from the data, so a sparse month still shows as zero, not absent.
const WINDOW_MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

export function buildMonthlyTrend(
  posts: SocialPost[],
  leads: Lead[],
  category: string | null
): MonthlyPoint[] {
  const engByMonth = new Map<string, number>();
  const leadsByMonth = new Map<string, number>();

  for (const p of posts) {
    if (category && p.service_category !== category) continue;
    const m = p.post_date.slice(0, 7);
    engByMonth.set(m, (engByMonth.get(m) ?? 0) + p.engagements);
  }
  for (const l of leads) {
    if (category && l.service_category !== category) continue;
    const m = l.enquiry_date.slice(0, 7);
    leadsByMonth.set(m, (leadsByMonth.get(m) ?? 0) + 1);
  }

  return WINDOW_MONTHS.map((m) => ({
    month: m,
    label: monthLabel(m),
    engagements: engByMonth.get(m) ?? 0,
    leads: leadsByMonth.get(m) ?? 0,
  }));
}
