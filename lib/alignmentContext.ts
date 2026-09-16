import { formatDate, formatINR } from "./format";
import type { CategoryAlignment, SubServiceAlignment } from "./alignment";
import type { SocialPost } from "./types";

export function buildAlignmentDataContext(
  categories: CategoryAlignment[],
  subServices: SubServiceAlignment[],
  posts: SocialPost[],
  avgSubServices: number,
  windowStart: string,
  windowEnd: string
): string {
  const totalReach = categories.reduce((s, c) => s + c.reach, 0);
  const totalLeads = categories.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = categories.reduce((s, c) => s + c.revenue, 0);
  const totalSpend = categories.reduce((s, c) => s + c.ad_spend, 0);

  const perCategory = categories
    .map((c) => {
      const paidPosts = posts.filter((p) => p.service_category === c.service_category && p.is_paid === "Yes").length;
      return `${c.service_category}
  Social: ${c.posts} posts, ${c.reach} reach, ${c.engagements} engagements, ${c.engagement_rate_pct}% engagement rate, ${c.link_clicks} clicks, ${paidPosts} paid, ${formatINR(c.ad_spend)} spend
  Demand: ${c.leads} leads, ${c.conversion_rate_pct}% converted, ${formatINR(c.pipeline_value)} pipeline
  Revenue: ${formatINR(c.revenue)} active annual fees, ${c.n_clients} clients
  Shares: ${c.attention_share_pct}% of reach, ${c.lead_share_pct}% of leads, ${c.revenue_share_pct}% of revenue
  Alignment gap: ${c.alignment_gap} (${c.label})`;
    })
    .join("\n\n");

  const mostMisaligned = [...categories]
    .sort((a, b) => Math.abs(b.alignment_gap) - Math.abs(a.alignment_gap))
    .slice(0, 3);
  const misalignedNames = new Set(mostMisaligned.map((c) => c.service_category));

  const subServiceDetail = subServices
    .filter((s) => misalignedNames.has(s.service_category))
    .map(
      (s) =>
        `  ${s.sub_service_name}: ${s.posts} posts, ${s.reach} reach, ${s.engagement_rate_pct}% eng rate, ${s.leads} leads, ${s.penetration_pct}% of clients hold it, ${formatINR(s.base_annual_fee_inr)} typical fee, statutory: ${s.is_statutory}`
    )
    .join("\n");

  return `PERIOD: ${formatDate(windowStart)} to ${formatDate(windowEnd)}

PER CATEGORY
${perCategory}

SUB-SERVICE DETAIL FOR THE THREE MOST MISALIGNED CATEGORIES (${[...misalignedNames].join(", ")})
${subServiceDetail}

FIRM TOTALS
Total reach: ${totalReach}
Total leads: ${totalLeads}
Total active annual revenue: ${formatINR(totalRevenue)}
Total ad spend: ${formatINR(totalSpend)}
Average sub-services held per active client: ${avgSubServices.toFixed(1)} of 30`;
}
