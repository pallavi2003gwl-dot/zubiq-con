import { daysSince } from "./format";
import type { Lead } from "./types";

export type Bucket = "Hot" | "Warm" | "Cold";

export interface LeadScoreBreakdown {
  value: number;
  urgency: number;
  stage: number;
  recency: number;
  source: number;
}

export interface ScoredLead {
  lead: Lead;
  score: number;
  bucket: Bucket;
  breakdown: LeadScoreBreakdown;
  isSwitching: boolean;
  excludedNoConsent: boolean;
  daysSinceLastTouch: number | null;
  isStale: boolean;
  unfilledFields: string[];
}

const OPEN_STATUSES = new Set<Lead["status"]>(["New", "Contacted", "Qualified"]);

const URGENCY_SCORE: Record<string, number> = {
  "Immediate (deadline within 15 days)": 20,
  "This month": 14,
  "This quarter": 7,
  "Just exploring": 2,
};
const URGENCY_BLANK_SCORE = 5;

const STAGE_SCORE: Record<string, number> = {
  Qualified: 20,
  Contacted: 12,
  New: 8,
};

const SOURCE_SCORE: Record<string, number> = {
  Referral: 15,
  "Walk-in": 13,
  "Website Direct": 11,
  LinkedIn: 10,
  "Google Search": 8,
  Instagram: 6,
};
const PARTIAL_CHATBOT_PENALTY = 5;

function recencyScore(days: number | null): number {
  if (days === null) return 20; // no reference date at all — treat as fresh, can't penalize what isn't there
  if (days <= 7) return 20;
  if (days >= 30) return 0;
  return 20 * ((30 - days) / (30 - 7));
}

export function isOpenLead(lead: Lead): boolean {
  return OPEN_STATUSES.has(lead.status);
}

export function scoreLeads(leads: Lead[]): ScoredLead[] {
  const openLeads = leads.filter(isOpenLead);
  const maxValue = Math.max(1, ...openLeads.map((l) => l.estimated_value_inr));

  return openLeads.map((lead) => {
    const valueScore = 25 * (lead.estimated_value_inr / maxValue);
    const urgencyScore = lead.urgency ? URGENCY_SCORE[lead.urgency] ?? URGENCY_BLANK_SCORE : URGENCY_BLANK_SCORE;
    const stageScore = STAGE_SCORE[lead.status] ?? 0;

    const reference = lead.last_contact_date ?? lead.enquiry_date;
    const days = daysSince(reference);
    const recScore = recencyScore(days);

    let sourceScore = lead.source ? SOURCE_SCORE[lead.source] ?? 0 : 0;
    if (lead.chatbot_completion === "Partial") sourceScore -= PARTIAL_CHATBOT_PENALTY;
    sourceScore = Math.max(0, sourceScore);

    const score = valueScore + urgencyScore + stageScore + recScore + sourceScore;
    const bucket: Bucket = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";

    const unfilledFields: string[] = [];
    if (!lead.annual_turnover_band) unfilledFields.push("annual_turnover_band");
    if (!lead.urgency) unfilledFields.push("urgency");
    if (!lead.existing_ca_status) unfilledFields.push("existing_ca_status");
    if (!lead.preferred_contact_mode) unfilledFields.push("preferred_contact_mode");
    if (!lead.preferred_contact_time) unfilledFields.push("preferred_contact_time");
    if (!lead.notes) unfilledFields.push("notes");

    return {
      lead,
      score: Math.round(score * 10) / 10,
      bucket,
      breakdown: {
        value: Math.round(valueScore * 10) / 10,
        urgency: urgencyScore,
        stage: stageScore,
        recency: Math.round(recScore * 10) / 10,
        source: sourceScore,
      },
      isSwitching: (lead.existing_ca_status ?? "").toLowerCase().includes("considering a switch"),
      excludedNoConsent: lead.consent_to_contact === "No",
      daysSinceLastTouch: days,
      isStale: days !== null && days >= 14,
      unfilledFields,
    };
  });
}
