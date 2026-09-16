import type { Client, Engagement, SubService } from "./types";
import { buildClientServiceSummaries, type ClientServiceSummary } from "./serviceMix";
import { daysSince } from "./format";

// Sub-service IDs referenced by the rules. Matched by ID, not name — the CSV's
// sub_service_name strings don't always match PRD.md's shorthand (e.g. the catalogue
// says "Income Tax Return Filing", the PRD table says "ITR Filing").
const SS = {
  ITR_FILING: "SS0101",
  ADVANCE_TAX_PLANNING: "SS0102",
  GST_MONTHLY_RETURNS: "SS0202",
  GST_ANNUAL_RETURN: "SS0203",
  GST_EINVOICING: "SS0204",
  MONTHLY_BOOKS_CLOSURE: "SS0301",
  FINANCIAL_STATEMENT_PREP: "SS0302",
  PAYROLL: "SS0303",
  ROC_ANNUAL_FILINGS: "SS0403",
  DIN_DSC_REGISTERS: "SS0404",
  STATUTORY_AUDIT: "SS0501",
  TAX_AUDIT_44AB: "SS0502",
  STOCK_INVENTORY_AUDIT: "SS0504",
  VCFO_BUDGETING_FORECASTING: "SS0601",
} as const;

const VCFO_IDS = ["SS0601", "SS0602", "SS0603", "SS0604", "SS0605"];

const HIGH_TURNOVER_BANDS = new Set(["2Cr - 10Cr", "10Cr+"]);
const COMPANY_LIKE_ENTITIES = new Set(["Private Limited", "LLP"]);
const STOCK_AUDIT_INDUSTRIES = new Set(["Manufacturing", "Retail & Trading", "Logistics"]);

export type Priority = "High" | "Medium";

export interface UpsellOpportunity {
  ruleId: string;
  ruleDescription: string;
  client: Client;
  subService: SubService;
  isStatutory: boolean;
  indicativeAnnualFeeInr: number;
  priority: Priority;
  tenureMonths: number;
}

export interface UnderpenetratedFlag {
  client: Client;
  tenureMonths: number;
  subServicesHeld: number;
}

export interface UpsellResult {
  opportunities: UpsellOpportunity[];
  flags: UnderpenetratedFlag[];
}

function tenureMonths(onboardedDate: string): number {
  const days = daysSince(onboardedDate) ?? 0;
  return Math.floor(days / 30.44);
}

export function computeUpsellOpportunities(
  clients: Client[],
  engagements: Engagement[],
  subServices: SubService[]
): UpsellResult {
  const subServiceById = new Map(subServices.map((s) => [s.sub_service_id, s]));
  const summaries = buildClientServiceSummaries(clients, engagements);
  const opportunities: UpsellOpportunity[] = [];
  const flags: UnderpenetratedFlag[] = [];

  function addOpportunity(
    client: Client,
    subServiceId: string,
    ruleId: string,
    ruleDescription: string,
    priority: Priority
  ) {
    const subService = subServiceById.get(subServiceId);
    if (!subService) return;
    opportunities.push({
      ruleId,
      ruleDescription,
      client,
      subService,
      isStatutory: subService.is_statutory === "Yes",
      indicativeAnnualFeeInr: subService.base_annual_fee_inr,
      priority,
      tenureMonths: tenureMonths(client.onboarded_date),
    });
  }

  for (const client of clients) {
    if (client.status !== "Active") continue;
    const summary = summaries.get(client.client_id) as ClientServiceSummary;
    const held = summary.subServiceIds;
    const holds = (id: string) => held.has(id);
    const missing = (id: string) => !held.has(id);

    // --- Statutory rules (High priority) ---
    if (holds(SS.ITR_FILING) && missing(SS.ADVANCE_TAX_PLANNING)) {
      addOpportunity(client, SS.ADVANCE_TAX_PLANNING, "R1", "Holds ITR Filing", "High");
    }
    if (
      holds(SS.GST_MONTHLY_RETURNS) &&
      HIGH_TURNOVER_BANDS.has(client.annual_turnover_band) &&
      missing(SS.GST_ANNUAL_RETURN)
    ) {
      addOpportunity(
        client,
        SS.GST_ANNUAL_RETURN,
        "R2",
        "Holds GST Returns and turnover band is 2Cr–10Cr or 10Cr+",
        "High"
      );
    }
    if (COMPANY_LIKE_ENTITIES.has(client.entity_type) && missing(SS.ROC_ANNUAL_FILINGS)) {
      addOpportunity(client, SS.ROC_ANNUAL_FILINGS, "R3", "Entity is Private Limited or LLP", "High");
    }
    if (client.entity_type === "Private Limited" && missing(SS.STATUTORY_AUDIT)) {
      addOpportunity(client, SS.STATUTORY_AUDIT, "R4", "Entity is Private Limited", "High");
    }
    if (HIGH_TURNOVER_BANDS.has(client.annual_turnover_band) && missing(SS.TAX_AUDIT_44AB)) {
      addOpportunity(client, SS.TAX_AUDIT_44AB, "R5", "Turnover band is 2Cr–10Cr or 10Cr+", "High");
    }
    if (
      holds(SS.MONTHLY_BOOKS_CLOSURE) &&
      COMPANY_LIKE_ENTITIES.has(client.entity_type) &&
      missing(SS.FINANCIAL_STATEMENT_PREP)
    ) {
      addOpportunity(
        client,
        SS.FINANCIAL_STATEMENT_PREP,
        "R6",
        "Holds Monthly Books Closure and entity is Pvt Ltd or LLP",
        "High"
      );
    }
    if (COMPANY_LIKE_ENTITIES.has(client.entity_type) && missing(SS.DIN_DSC_REGISTERS)) {
      addOpportunity(client, SS.DIN_DSC_REGISTERS, "R7", "Entity is Private Limited or LLP", "High");
    }
    if (client.annual_turnover_band === "10Cr+" && holds(SS.GST_MONTHLY_RETURNS) && missing(SS.GST_EINVOICING)) {
      addOpportunity(
        client,
        SS.GST_EINVOICING,
        "R8",
        "Turnover band is 10Cr+ and holds GST Returns",
        "High"
      );
    }

    // --- Commercial rules (Medium priority) ---
    const vcfoHeldCount = VCFO_IDS.filter((id) => holds(id)).length;
    if (vcfoHeldCount >= 1 && vcfoHeldCount < 3) {
      for (const id of VCFO_IDS) {
        if (missing(id)) {
          addOpportunity(
            client,
            id,
            "R9",
            "Holds a Virtual CFO sub-service but fewer than 3 of 5",
            "Medium"
          );
        }
      }
    } else if (client.annual_turnover_band === "10Cr+" && vcfoHeldCount === 0) {
      addOpportunity(
        client,
        SS.VCFO_BUDGETING_FORECASTING,
        "R10",
        "Turnover 10Cr+ and holds no Virtual CFO service",
        "Medium"
      );
    }
    if (holds(SS.MONTHLY_BOOKS_CLOSURE) && missing(SS.PAYROLL)) {
      addOpportunity(client, SS.PAYROLL, "R11", "Holds Monthly Books Closure, no Payroll", "Medium");
    }
    if (STOCK_AUDIT_INDUSTRIES.has(client.industry) && missing(SS.STOCK_INVENTORY_AUDIT)) {
      addOpportunity(
        client,
        SS.STOCK_INVENTORY_AUDIT,
        "R12",
        "Industry is Manufacturing, Retail & Trading, or Logistics, no Stock Audit",
        "Medium"
      );
    }

    // R13: portfolio flag, not a specific-service opportunity.
    const months = tenureMonths(client.onboarded_date);
    if (months >= 18 && held.size < 3) {
      flags.push({ client, tenureMonths: months, subServicesHeld: held.size });
    }
  }

  return { opportunities, flags };
}
