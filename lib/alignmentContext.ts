import { formatDate, formatINR } from "./format";
import type { CategoryAlignment, SubServiceAlignment } from "./alignment";
import type { SocialPost } from "./types";

// Builds the FULL default prompt that pre-fills the Alignment panel's textarea —
// framing, the per-category/sub-service data, and the instruction, all as one
// editable block. No separate hidden system prompt; the panel sends this text
// as-is (edited or not).
export function buildAlignmentPrompt(
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

  return `You're a marketing strategist advising ZubiQ Consultants, a Chartered Accountancy firm in Noida, India, on its social media and advertising allocation. Here's the firm's social effort, inbound demand, and revenue by category over the period, with an alignment gap already computed:

PERIOD: ${formatDate(windowStart)} to ${formatDate(windowEnd)}

PER CATEGORY
${perCategory}

SUB-SERVICE DETAIL FOR THE THREE MOST MISALIGNED CATEGORIES (${[...misalignedNames].join(", ")})
${subServiceDetail}

FIRM TOTALS
Total reach: ${totalReach}
Total leads: ${totalLeads}
Total active annual revenue: ${formatINR(totalRevenue)}
Total ad spend: ${formatINR(totalSpend)}
Average sub-services held per active client: ${avgSubServices.toFixed(1)} of 30

Analyse where social media effort doesn't match where revenue and demand actually are, and recommend what to change over the next quarter. Treat this as correlation, not attribution — there's no UTM or click-path tracking, so don't claim any post caused any lead. Recommendations must be executable by a small firm with no dedicated marketing team; assume limited budget and content capacity. When naming what to post about, name specific sub-services, never whole categories — "post about the GST annual return and advance tax planning" is useful, "post more about tax" is not. Return four short sections: KEY MISALIGNMENTS (2-3 biggest gaps with the number that proves it), CONTENT REALLOCATION (which sub-services to post more/less about, with a rough ratio), AD ANGLES (one per priority sub-service: audience, hook, objective), and WHAT TO MEASURE NEXT (3 metrics for the next 30 days).`;
}
