import { formatDate, formatINR } from "./format";
import { buildClientServiceSummaries } from "./serviceMix";
import type { UpsellOpportunity } from "./upsell";
import type { Client, Engagement, SubServiceAlignmentRow } from "./types";

export function buildUpsellDataContext(
  opportunity: UpsellOpportunity,
  clients: Client[],
  engagements: Engagement[],
  subServiceAlignment: SubServiceAlignmentRow[],
  avgSubServices: number
): string {
  const { client, subService } = opportunity;
  const summaries = buildClientServiceSummaries(clients, engagements);
  const summary = summaries.get(client.client_id)!;

  const heldEngagements = engagements.filter(
    (e) => e.client_id === client.client_id && e.status === "Active"
  );

  const relatedInCategory = heldEngagements.filter((e) => e.service_category === subService.service_category);

  const peers = clients.filter(
    (c) =>
      c.client_id !== client.client_id &&
      c.status === "Active" &&
      c.entity_type === client.entity_type &&
      c.annual_turnover_band === client.annual_turnover_band
  );
  const peersWithService = peers.filter((p) => summaries.get(p.client_id)?.subServiceIds.has(subService.sub_service_id));

  const firmPenetration = subServiceAlignment.find((r) => r.sub_service_id === subService.sub_service_id);
  const tenureMonths = opportunity.tenureMonths;

  return `CLIENT
Name: ${client.client_name}
Industry: ${client.industry}
Entity type: ${client.entity_type}
City: ${client.city}
Annual turnover band: ${client.annual_turnover_band}
Client since: ${formatDate(client.onboarded_date)} (${tenureMonths} months)
Relationship owner: ${client.relationship_owner}

SUB-SERVICES CURRENTLY HELD (${summary.subServiceIds.size} of 30)
${heldEngagements
  .map((e) => `- ${e.sub_service_name} (${e.service_category}), since ${formatDate(e.start_date)}, ${formatINR(e.annual_fee_inr)}`)
  .join("\n")}
Categories covered: ${summary.categories.size} of 6
Total current annual fee: ${formatINR(summary.totalAnnualFeeInr)}

OPPORTUNITY
Missing sub-service: ${subService.sub_service_name}
Category: ${subService.service_category}
Statutory: ${subService.is_statutory}
Why it applies to this client: ${subService.relevance_trigger}
Indicative annual fee: ${formatINR(subService.base_annual_fee_inr)}
Gap rule triggered: ${opportunity.ruleId} - ${opportunity.ruleDescription}
Priority: ${opportunity.priority}

RELATED SERVICES THIS CLIENT ALREADY BUYS IN THE SAME CATEGORY
${relatedInCategory.length > 0 ? relatedInCategory.map((e) => `- ${e.sub_service_name}`).join("\n") : "None"}

PEER BENCHMARK
Among ZubiQ clients with entity type ${client.entity_type} and turnover band ${client.annual_turnover_band}:
${peers.length} clients, ${peersWithService.length} hold ${subService.sub_service_name}
Firm-wide penetration of ${subService.sub_service_name}: ${firmPenetration?.penetration_pct ?? 0}% of active clients
Average sub-services per client across the firm: ${avgSubServices.toFixed(1)} of 30`;
}
