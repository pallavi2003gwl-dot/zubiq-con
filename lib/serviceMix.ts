import type { Client, Engagement } from "./types";

export interface ClientServiceSummary {
  client: Client;
  subServiceIds: Set<string>;
  categories: Set<string>;
  totalAnnualFeeInr: number;
}

/** Active engagements only — a Dormant client's engagements are Lapsed and don't count as "held". */
export function buildClientServiceSummaries(
  clients: Client[],
  engagements: Engagement[]
): Map<string, ClientServiceSummary> {
  const byClient = new Map<string, ClientServiceSummary>();
  for (const client of clients) {
    byClient.set(client.client_id, {
      client,
      subServiceIds: new Set(),
      categories: new Set(),
      totalAnnualFeeInr: 0,
    });
  }
  for (const eng of engagements) {
    if (eng.status !== "Active") continue;
    const summary = byClient.get(eng.client_id);
    if (!summary) continue;
    summary.subServiceIds.add(eng.sub_service_id);
    summary.categories.add(eng.service_category);
    summary.totalAnnualFeeInr += eng.annual_fee_inr;
  }
  return byClient;
}

export function averageServicePenetration(
  clients: Client[],
  engagements: Engagement[]
): { avgSubServices: number; avgCategories: number } {
  const active = clients.filter((c) => c.status === "Active");
  const summaries = buildClientServiceSummaries(clients, engagements);
  if (active.length === 0) return { avgSubServices: 0, avgCategories: 0 };
  let subTotal = 0;
  let catTotal = 0;
  for (const client of active) {
    const s = summaries.get(client.client_id);
    subTotal += s?.subServiceIds.size ?? 0;
    catTotal += s?.categories.size ?? 0;
  }
  return {
    avgSubServices: subTotal / active.length,
    avgCategories: catTotal / active.length,
  };
}
