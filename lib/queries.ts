import { supabase } from "./supabase";
import type {
  Client,
  ClientServiceMatrixRow,
  CategoryAlignmentRow,
  Engagement,
  Lead,
  ServiceCategory,
  SocialPost,
  SubService,
  SubServiceAlignmentRow,
} from "./types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, label: string): T {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data as T;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await supabase
    .from("service_categories")
    .select("*")
    .order("service_id")
    .returns<ServiceCategory[]>();
  return unwrap(res, "getServiceCategories");
}

export async function getSubServices(): Promise<SubService[]> {
  const res = await supabase
    .from("sub_services")
    .select("*")
    .order("sub_service_id")
    .returns<SubService[]>();
  return unwrap(res, "getSubServices");
}

export async function getClients(): Promise<Client[]> {
  const res = await supabase
    .from("clients")
    .select("*")
    .order("client_id")
    .returns<Client[]>();
  return unwrap(res, "getClients");
}

export async function getEngagements(): Promise<Engagement[]> {
  const res = await supabase
    .from("engagements")
    .select("*")
    .order("engagement_id")
    .returns<Engagement[]>();
  return unwrap(res, "getEngagements");
}

export async function getLeads(): Promise<Lead[]> {
  const res = await supabase
    .from("leads")
    .select("*")
    .order("enquiry_date", { ascending: false })
    .returns<Lead[]>();
  return unwrap(res, "getLeads");
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const res = await supabase
    .from("social_posts")
    .select("*")
    .order("post_date")
    .returns<SocialPost[]>();
  return unwrap(res, "getSocialPosts");
}

export async function getClientServiceMatrix(): Promise<ClientServiceMatrixRow[]> {
  const res = await supabase
    .from("v_client_service_matrix")
    .select("*")
    .returns<ClientServiceMatrixRow[]>();
  return unwrap(res, "getClientServiceMatrix");
}

export async function getCategoryAlignment(): Promise<CategoryAlignmentRow[]> {
  const res = await supabase
    .from("v_category_alignment")
    .select("*")
    .returns<CategoryAlignmentRow[]>();
  return unwrap(res, "getCategoryAlignment");
}

export async function getSubServiceAlignment(): Promise<SubServiceAlignmentRow[]> {
  const res = await supabase
    .from("v_subservice_alignment")
    .select("*")
    .returns<SubServiceAlignmentRow[]>();
  return unwrap(res, "getSubServiceAlignment");
}
