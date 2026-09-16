import { formatDate, formatINR, daysSince } from "./format";
import type { ScoredLead } from "./leadScore";
import type { CategoryAlignmentRow, Lead } from "./types";

const FIELD_LABELS: Record<string, string> = {
  annual_turnover_band: "Annual turnover band",
  urgency: "Urgency",
  existing_ca_status: "Existing CA arrangement",
  preferred_contact_mode: "Preferred contact mode",
  preferred_contact_time: "Preferred contact time",
  notes: "Notes",
};

export function buildConversionDataContext(
  scored: ScoredLead,
  allLeads: Lead[],
  categoryAlignment: CategoryAlignmentRow[]
): string {
  const { lead, breakdown, score, bucket, unfilledFields } = scored;
  const daysSinceEnquiry = daysSince(lead.enquiry_date);
  const daysSinceContact = daysSince(lead.last_contact_date);

  const interestLeads = allLeads.filter((l) => l.sub_service_interest === lead.sub_service_interest);
  const interestConverted = interestLeads.filter((l) => l.status === "Converted").length;
  const interestConversionRate = interestLeads.length > 0 ? (interestConverted / interestLeads.length) * 100 : 0;

  const catRow = categoryAlignment.find((r) => r.service_category === lead.service_category);

  return `LEAD
Contact: ${lead.contact_name}
Company: ${lead.company_name && lead.company_name !== "-" ? lead.company_name : "Individual"}
Industry: ${lead.industry ?? "Not captured"}
Entity type: ${lead.entity_type ?? "Not captured"}
City: ${lead.city ?? "Not captured"}
Annual turnover band: ${lead.annual_turnover_band ?? "Not captured"}
Service category: ${lead.service_category}
Specific service asked about: ${lead.sub_service_interest}
Urgency stated: ${lead.urgency ?? "Not captured"}
Existing CA arrangement: ${lead.existing_ca_status ?? "Not captured"}
Preferred contact: ${lead.preferred_contact_mode ?? "Not captured"}, ${lead.preferred_contact_time ?? "Not captured"}
Source: ${lead.source ?? "Not captured"} via ${lead.capture_method ?? "Not captured"}
Chatbot session: ${lead.chatbot_completion ?? "NA"}
Enquiry date: ${formatDate(lead.enquiry_date)} (${daysSinceEnquiry ?? "?"} days ago)
Last contacted: ${lead.last_contact_date ? formatDate(lead.last_contact_date) : "Never"} (${
    daysSinceContact !== null ? `${daysSinceContact} days ago` : "not yet contacted"
  })
Current status: ${lead.status}
Estimated value: ${formatINR(lead.estimated_value_inr)}
Enquiry notes: ${lead.notes ?? "Not captured"}

LEAD SCORE: ${score}/100 (${bucket})
  Value: ${breakdown.value}/25
  Urgency: ${breakdown.urgency}/20
  Stage: ${breakdown.stage}/20
  Recency: ${breakdown.recency}/20
  Source and capture: ${breakdown.source}/15

BENCHMARK
${lead.sub_service_interest} leads: ${interestLeads.length} total, ${interestConversionRate.toFixed(1)}% convert
${lead.service_category} category conversion rate: ${catRow?.conversion_rate_pct ?? 0}%

FIELDS NOT CAPTURED
${unfilledFields.length > 0 ? unfilledFields.map((f) => FIELD_LABELS[f] ?? f).join(", ") : "none"}`;
}
