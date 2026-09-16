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

// Builds the FULL default prompt that pre-fills the Conversion panel's textarea —
// framing, the lead/score data, and the instruction, all as one editable block.
// No separate hidden system prompt; the panel sends this text as-is (edited or not).
export function buildConversionPrompt(
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

  return `You're a sales advisor to ZubiQ Consultants, a Chartered Accountancy firm in Noida, India. Here's an inbound lead with their enquiry details and a computed lead score:

LEAD
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
${unfilledFields.length > 0 ? unfilledFields.map((f) => FIELD_LABELS[f] ?? f).join(", ") : "none"}

Build a follow-up plan to convert this lead. Be realistic about the stage they're at and how long they've been waiting — a lead untouched for three weeks needs a different opening than one from yesterday. Use the urgency and existing-CA fields: a deadline inside 15 days needs a call today, not a nurture sequence; a lead already working with another CA has a switching objection about continuity, not price. If FIELDS NOT CAPTURED is non-empty, the visitor abandoned the chatbot partway — ask about those gaps on the first call, and recommend a phone call rather than email, since these leads have never converted from email in the firm's data. Never quote a fee; the firm scopes and prices each engagement and offers a free first consultation within 48 hours — book that instead. Use Indian CA context and terminology throughout. Return four short sections: CHANNEL AND TIMING, LIKELY OBJECTION, FOLLOW-UP SEQUENCE (3 steps with day offsets), and DRAFT FIRST MESSAGE.`;
}
