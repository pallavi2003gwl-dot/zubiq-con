-- ZubiQ AI Marketing Recommendation Engine (Pilot) -- schema v2
-- Run in the Supabase SQL Editor before importing CSVs from /data.
-- Import order: service_categories -> sub_services -> clients -> engagements
--               -> leads -> social_posts

drop view if exists v_subservice_alignment;
drop view if exists v_category_alignment;
drop view if exists v_client_service_matrix;
drop table if exists social_posts;
drop table if exists leads;
drop table if exists engagements;
drop table if exists clients;
drop table if exists sub_services;
drop table if exists service_categories;

-- ---------------------------------------------------------------- taxonomy

create table service_categories (
  service_id        text primary key,
  service_category  text not null unique,
  category_name     text not null
);

create table sub_services (
  sub_service_id       text primary key,
  service_id           text not null references service_categories (service_id),
  service_category     text not null,
  sub_service_name     text not null,
  base_annual_fee_inr  integer not null,
  is_recurring         text not null,
  is_entry_service     text not null,
  is_statutory         text not null,   -- the column the upsell rules lean on
  relevance_trigger    text not null    -- plain-language condition, fed to the AI
);

create index idx_ss_category  on sub_services (service_category);
create index idx_ss_statutory on sub_services (is_statutory);

-- ---------------------------------------------------------------- clients

create table clients (
  client_id             text primary key,
  client_name           text not null,
  industry              text not null,
  entity_type           text not null,
  city                  text not null,
  annual_turnover_band  text not null,
  onboarded_date        date not null,
  relationship_owner    text not null,
  status                text not null
);

create index idx_clients_industry on clients (industry);
create index idx_clients_status   on clients (status);
create index idx_clients_band     on clients (annual_turnover_band);
create index idx_clients_entity   on clients (entity_type);

-- ---------------------------------------------------------------- engagements

create table engagements (
  engagement_id      text primary key,
  client_id          text not null references clients (client_id),
  sub_service_id     text not null references sub_services (sub_service_id),
  service_id         text not null,
  service_category   text not null,
  sub_service_name   text not null,
  start_date         date not null,
  annual_fee_inr     integer not null,
  billing_frequency  text not null,
  status             text not null
);

create index idx_eng_client   on engagements (client_id);
create index idx_eng_sub      on engagements (sub_service_id);
create index idx_eng_category on engagements (service_category);
create index idx_eng_status   on engagements (status);

-- ---------------------------------------------------------------- leads
-- Nullable columns are deliberate. Partial chatbot sessions leave the later
-- questions blank, and New leads have no contact history yet. See
-- docs/DATA_DICTIONARY.md and docs/CHATBOT_SPEC.md.

create table leads (
  lead_id                 text primary key,
  enquiry_date            date not null,
  contact_name            text not null,
  phone                   text not null,
  email                   text,
  company_name            text,
  entity_type             text,
  industry                text,
  city                    text,
  annual_turnover_band    text,          -- blank on partial sessions
  service_category        text not null,
  sub_service_interest    text not null,
  sub_service_id          text references sub_services (sub_service_id),
  urgency                 text,          -- blank on partial sessions
  existing_ca_status      text,          -- blank on partial sessions
  preferred_contact_mode  text,
  preferred_contact_time  text,
  notes                   text,
  consent_to_contact      text,
  source                  text,
  capture_method          text,
  chatbot_completion      text,
  status                  text not null,
  last_contact_date       date,          -- blank for New leads
  assigned_to             text,          -- blank for New leads
  estimated_value_inr     integer not null
);

create index idx_leads_status     on leads (status);
create index idx_leads_category   on leads (service_category);
create index idx_leads_sub        on leads (sub_service_id);
create index idx_leads_date       on leads (enquiry_date);
create index idx_leads_urgency    on leads (urgency);
create index idx_leads_completion on leads (chatbot_completion);

-- ---------------------------------------------------------------- social_posts

create table social_posts (
  post_id           text primary key,
  post_date         date not null,
  platform          text not null,
  service_category  text not null,
  sub_service_id    text references sub_services (sub_service_id),
  sub_service_name  text,
  content_format    text not null,
  topic             text,
  reach             integer not null,
  impressions       integer not null,
  engagements       integer not null,
  link_clicks       integer not null,
  saves             integer not null,
  is_paid           text not null,
  spend_inr         integer not null default 0
);

create index idx_social_category on social_posts (service_category);
create index idx_social_sub      on social_posts (sub_service_id);
create index idx_social_date     on social_posts (post_date);

-- ================================================================ views

-- Every client crossed with every sub-service they hold. Left join keeps clients
-- with no engagements visible. Drives Modules 1 and 2.
create view v_client_service_matrix as
select
  c.client_id,
  c.client_name,
  c.industry,
  c.entity_type,
  c.city,
  c.annual_turnover_band,
  c.relationship_owner,
  c.onboarded_date,
  c.status                as client_status,
  e.sub_service_id,
  e.sub_service_name,
  e.service_category,
  e.annual_fee_inr,
  e.start_date,
  e.status                as engagement_status
from clients c
left join engagements e on e.client_id = c.client_id;

-- Category-level alignment: social effort vs demand vs revenue, with shares
-- and the attention-minus-revenue gap precomputed. Module 4 headline.
create view v_category_alignment as
with social as (
  select service_category,
         count(*)                                    as posts,
         sum(reach)                                  as reach,
         sum(engagements)                            as engagements,
         sum(link_clicks)                            as link_clicks,
         sum(spend_inr)                              as ad_spend,
         round(sum(engagements)::numeric
               / nullif(sum(reach), 0) * 100, 2)     as engagement_rate_pct
  from social_posts group by service_category
),
demand as (
  select service_category,
         count(*)                                    as leads,
         count(*) filter (where status = 'Converted') as converted,
         round(count(*) filter (where status = 'Converted')::numeric
               / nullif(count(*), 0) * 100, 1)       as conversion_rate_pct,
         sum(estimated_value_inr)                    as pipeline_value
  from leads group by service_category
),
revenue as (
  select service_category,
         sum(annual_fee_inr)                         as revenue,
         count(distinct client_id)                   as n_clients
  from engagements where status = 'Active' group by service_category
)
select
  sc.service_id,
  sc.service_category,
  sc.category_name,
  coalesce(s.posts, 0)                as posts,
  coalesce(s.reach, 0)                as reach,
  coalesce(s.engagements, 0)          as engagements,
  coalesce(s.engagement_rate_pct, 0)  as engagement_rate_pct,
  coalesce(s.link_clicks, 0)          as link_clicks,
  coalesce(s.ad_spend, 0)             as ad_spend,
  coalesce(d.leads, 0)                as leads,
  coalesce(d.conversion_rate_pct, 0)  as conversion_rate_pct,
  coalesce(d.pipeline_value, 0)       as pipeline_value,
  coalesce(r.revenue, 0)              as revenue,
  coalesce(r.n_clients, 0)            as n_clients,
  round(coalesce(s.reach, 0)::numeric
        / nullif((select sum(reach) from social_posts), 0) * 100, 1)   as attention_share_pct,
  round(coalesce(d.leads, 0)::numeric
        / nullif((select count(*) from leads), 0) * 100, 1)            as lead_share_pct,
  round(coalesce(r.revenue, 0)::numeric
        / nullif((select sum(annual_fee_inr) from engagements
                  where status = 'Active'), 0) * 100, 1)               as revenue_share_pct,
  round(
    coalesce(s.reach, 0)::numeric
      / nullif((select sum(reach) from social_posts), 0) * 100
    - coalesce(r.revenue, 0)::numeric
      / nullif((select sum(annual_fee_inr) from engagements
                where status = 'Active'), 0) * 100, 1)                 as alignment_gap
from service_categories sc
left join social  s on s.service_category  = sc.service_category
left join demand  d on d.service_category  = sc.service_category
left join revenue r on r.service_category  = sc.service_category
order by revenue desc nulls last;

-- Sub-service level: the drill-down. Penetration is the share of active clients
-- holding each sub-service, which is what makes the upsell headroom visible.
create view v_subservice_alignment as
with active_clients as (
  select count(*) as n from clients where status = 'Active'
),
held as (
  select sub_service_id,
         count(distinct client_id) as n_clients,
         sum(annual_fee_inr)       as revenue
  from engagements where status = 'Active' group by sub_service_id
),
social as (
  select sub_service_id,
         count(*)        as posts,
         sum(reach)      as reach,
         sum(engagements) as engagements,
         round(sum(engagements)::numeric
               / nullif(sum(reach), 0) * 100, 2) as engagement_rate_pct
  from social_posts group by sub_service_id
),
demand as (
  select sub_service_id,
         count(*) as leads,
         count(*) filter (where status = 'Converted') as converted
  from leads group by sub_service_id
)
select
  ss.sub_service_id,
  ss.service_category,
  ss.sub_service_name,
  ss.base_annual_fee_inr,
  ss.is_statutory,
  ss.relevance_trigger,
  coalesce(h.n_clients, 0)  as clients_holding,
  (select n from active_clients) as active_clients,
  round(coalesce(h.n_clients, 0)::numeric
        / nullif((select n from active_clients), 0) * 100, 1) as penetration_pct,
  coalesce(h.revenue, 0)    as revenue,
  coalesce(s.posts, 0)      as posts,
  coalesce(s.reach, 0)      as reach,
  coalesce(s.engagement_rate_pct, 0) as engagement_rate_pct,
  coalesce(d.leads, 0)      as leads,
  coalesce(d.converted, 0)  as converted,
  -- headroom: what the remaining client base would be worth at the base fee
  ((select n from active_clients) - coalesce(h.n_clients, 0))
    * ss.base_annual_fee_inr as theoretical_headroom_inr
from sub_services ss
left join held   h on h.sub_service_id = ss.sub_service_id
left join social s on s.sub_service_id = ss.sub_service_id
left join demand d on d.sub_service_id = ss.sub_service_id
order by penetration_pct asc, ss.base_annual_fee_inr desc;

-- Note on theoretical_headroom_inr: it assumes every active client could buy every
-- sub-service, which is false. It is a sizing indicator for the dashboard, not a
-- forecast. The real qualified number comes from the rules in lib/upsell.ts, which
-- check entity type and turnover band before counting anything.

-- ================================================================ row level security
-- The pilot has no authentication (see CLAUDE.md ground rule 8) and reads through the
-- browser-safe anon key only. Enable RLS on every table (Supabase best practice, avoids
-- the dashboard security linter warning) and add one permissive read-only policy per
-- table. There is no write path from the app, so no insert/update/delete policy exists.

alter table service_categories enable row level security;
alter table sub_services       enable row level security;
alter table clients            enable row level security;
alter table engagements        enable row level security;
alter table leads              enable row level security;
alter table social_posts       enable row level security;

create policy "public read" on service_categories for select using (true);
create policy "public read" on sub_services       for select using (true);
create policy "public read" on clients            for select using (true);
create policy "public read" on engagements        for select using (true);
create policy "public read" on leads              for select using (true);
create policy "public read" on social_posts       for select using (true);
