// Hand-written row types matching supabase/schema.sql. No Supabase codegen is
// configured for this pilot, so these are kept in sync with schema.sql by hand.

export type YesNo = "Yes" | "No";

export interface ServiceCategory {
  service_id: string;
  service_category: string;
  category_name: string;
}

export interface SubService {
  sub_service_id: string;
  service_id: string;
  service_category: string;
  sub_service_name: string;
  base_annual_fee_inr: number;
  is_recurring: YesNo;
  is_entry_service: YesNo;
  is_statutory: YesNo;
  relevance_trigger: string;
}

export type ClientStatus = "Active" | "Dormant";

export interface Client {
  client_id: string;
  client_name: string;
  industry: string;
  entity_type: string;
  city: string;
  annual_turnover_band: string;
  onboarded_date: string;
  relationship_owner: string;
  status: ClientStatus;
}

export type EngagementStatus = "Active" | "Lapsed";

export interface Engagement {
  engagement_id: string;
  client_id: string;
  sub_service_id: string;
  service_id: string;
  service_category: string;
  sub_service_name: string;
  start_date: string;
  annual_fee_inr: number;
  billing_frequency: "Annual" | "One-time";
  status: EngagementStatus;
}

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
export type ChatbotCompletion = "Complete" | "Partial" | "NA";

export interface Lead {
  lead_id: string;
  enquiry_date: string;
  contact_name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  entity_type: string | null;
  industry: string | null;
  city: string | null;
  annual_turnover_band: string | null;
  service_category: string;
  sub_service_interest: string;
  sub_service_id: string | null;
  urgency: string | null;
  existing_ca_status: string | null;
  preferred_contact_mode: string | null;
  preferred_contact_time: string | null;
  notes: string | null;
  consent_to_contact: "Yes" | "No" | null;
  source: string | null;
  capture_method: string | null;
  chatbot_completion: ChatbotCompletion | null;
  status: LeadStatus;
  last_contact_date: string | null;
  assigned_to: string | null;
  estimated_value_inr: number;
}

export interface SocialPost {
  post_id: string;
  post_date: string;
  platform: "Instagram" | "LinkedIn" | "Facebook";
  service_category: string;
  sub_service_id: string | null;
  sub_service_name: string | null;
  content_format: string;
  topic: string | null;
  reach: number;
  impressions: number;
  engagements: number;
  link_clicks: number;
  saves: number;
  is_paid: YesNo;
  spend_inr: number;
}

export interface ClientServiceMatrixRow {
  client_id: string;
  client_name: string;
  industry: string;
  entity_type: string;
  city: string;
  annual_turnover_band: string;
  relationship_owner: string;
  onboarded_date: string;
  client_status: ClientStatus;
  sub_service_id: string | null;
  sub_service_name: string | null;
  service_category: string | null;
  annual_fee_inr: number | null;
  start_date: string | null;
  engagement_status: EngagementStatus | null;
}

export interface CategoryAlignmentRow {
  service_id: string;
  service_category: string;
  category_name: string;
  posts: number;
  reach: number;
  engagements: number;
  engagement_rate_pct: number;
  link_clicks: number;
  ad_spend: number;
  leads: number;
  conversion_rate_pct: number;
  pipeline_value: number;
  revenue: number;
  n_clients: number;
  attention_share_pct: number;
  lead_share_pct: number;
  revenue_share_pct: number;
  alignment_gap: number;
}

export interface SubServiceAlignmentRow {
  sub_service_id: string;
  service_category: string;
  sub_service_name: string;
  base_annual_fee_inr: number;
  is_statutory: YesNo;
  relevance_trigger: string;
  clients_holding: number;
  active_clients: number;
  penetration_pct: number;
  revenue: number;
  posts: number;
  reach: number;
  engagement_rate_pct: number;
  leads: number;
  converted: number;
  theoretical_headroom_inr: number;
}
