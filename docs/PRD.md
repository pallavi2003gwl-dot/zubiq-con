# Product Requirements: ZubiQ AI Marketing Recommendation Engine (Pilot)

## 1. Context

ZubiQ Consultants is a Chartered Accountancy firm founded in 2020, based in Sector 63,
Noida, led by Satyam Gahoi. It serves founders, family businesses, and NRIs across
Delhi-NCR through six service lines and roughly thirty distinct sub-services. The firm
reports 500+ filings closed and a 48-hour average response time.

Like most professional services firms of this size, ZubiQ holds three pools of data that
never speak to each other: existing clients, inbound enquiries, and social media output.

## 2. Problem statement

> ZubiQ cannot see the relationship between what it publishes, what it is asked for, and
> what it actually earns from. Marketing effort, sales follow-up, and service revenue are
> each allocated by instinct rather than by evidence.

There is a second problem underneath it. The firm thinks about its offering in six
categories, but it sells thirty services. At category level the client base looks well
served: the average active client holds 2.9 of 6 categories. At sub-service level the
same client base holds 4.8 of 30. The gap between those two numbers is invisible
revenue, and it is invisible precisely because nobody tracks the lower level.

## 3. Objective of the pilot

Build a working internal dashboard that unifies the three data pools **at sub-service
granularity**, and uses AI to turn the gaps between them into specific actions a small
team can execute the same week.

The granularity is the point. Six categories against fifty clients is a pivot table
anyone could build. Thirty sub-services, each with its own statutory trigger and turnover
condition, checked against fifty clients every month, is not something a human maintains
by hand. That is what justifies a tool.

## 4. Marketing frameworks applied

| Framework | Where it appears |
|-----------|------------------|
| **STP** | Module 1. Segments the client base by industry, entity type, turnover band, and service mix. The segmentation layer the firm has never had. |
| **Customer Lifetime Value / share of wallet** | Module 2. Revenue per client is a function of sub-services held, so the upsell engine is a CLV expansion tool measured as share of a 30-service wallet. |
| **Sales Funnel + AIDA** | Module 3. Leads scored by stage, urgency, and staleness; the AI writes the Interest-to-Action message. |
| **Marketing Mix (Promotion) effectiveness** | Module 4. Promotional effort per service against demand and revenue for that service. |

## 5. Users

| User | Needs |
|------|-------|
| Satyam Gahoi (Partner) | Portfolio view, expansion opportunities, revenue concentration risk |
| Relationship manager | A working list: who to call this week and what to say |
| Whoever runs social | Which topic to make content about next, and why |

---

## 6. Modules

### Module 1: Client & Lead Dashboard (no AI)

**Screen `/` (Overview)**

Four KPI cards:
- Active clients
- Total annual recurring fee value
- Open leads (not Converted, not Lost)
- **Service penetration: average sub-services per client, shown against 30**

That fourth card is the headline metric of the whole tool. Show both numbers: categories
held and sub-services held. The distance between them is the argument.

Below:
- **Revenue by category** — horizontal bar, sorted descending
- **Sub-service penetration heatmap** — 6 categories down, 5 sub-services across, each
  cell shaded by percentage of active clients holding it. Statutory services with low
  penetration get a border or marker. This single visual carries Module 2's whole case.
- **Clients by industry** and **by turnover band**
- **Lead funnel** — counts by status with conversion rate per category

**Screen `/clients`** — filterable table. Filters: industry, entity type, city, turnover
band, sub-service held, sub-service *missing*, status, owner. The missing-service filter
is what turns the table into a prospecting list. Row click opens the client drawer.

**Screen `/leads`** — filterable table. Filters: category, sub-service, status, source,
urgency, capture method, chatbot completion, date range. Highlight rows where the lead is
open and untouched for 14+ days. Handle blank fields from partial chatbot sessions
gracefully, show a "Partial capture" chip rather than empty cells.

---

### Module 2: Upsell / Cross-sell Engine (AI)

**Gap detection (deterministic, runs before any AI).**

For each active client, compare sub-services held against the 30-row catalogue. A gap
only counts when the client meets the sub-service's `relevance_trigger`. Never flag a
service the client could not legally or practically need.

**Statutory rules (High priority).** These are compliance exposures, not sales pitches,
which is what makes them credible in the client's inbox.

| Rule | Condition | Missing service |
|------|-----------|-----------------|
| R1 | Holds ITR Filing | Advance Tax Planning |
| R2 | Holds GST Returns and turnover band is 2Cr–10Cr or 10Cr+ | GST Annual Return & Reconciliation |
| R3 | Entity is Private Limited or LLP | ROC Annual Filings |
| R4 | Entity is Private Limited | Statutory Audit |
| R5 | Turnover band is 2Cr–10Cr or 10Cr+ | Tax Audit u/s 44AB |
| R6 | Holds Monthly Books Closure and entity is Pvt Ltd or LLP | Financial Statement Preparation |
| R7 | Entity is Private Limited or LLP | DIN / DSC & Statutory Registers |
| R8 | Turnover band is 10Cr+ and holds GST Returns | E-invoicing & E-way Bill Setup |

**Commercial rules (Medium priority).**

| Rule | Condition | Missing service |
|------|-----------|-----------------|
| R9 | Holds any Virtual CFO sub-service, holds fewer than 3 of 5 | The remaining Virtual CFO sub-services |
| R10 | Turnover 10Cr+ and holds no Virtual CFO at all | Budgeting & Forecasting as the entry point |
| R11 | Holds Monthly Books Closure, no Payroll | Payroll Processing |
| R12 | Industry is Manufacturing, Retail & Trading, or Logistics, no Stock Audit | Stock & Inventory Audit |
| R13 | Client onboarded 18+ months ago and holds fewer than 3 sub-services | Flag as an under-penetrated long-tenure account |

Each opportunity carries: client, missing sub-service, rule id, the sub-service's
`relevance_trigger` verbatim, statutory flag, indicative annual fee, priority.

**Screen `/upsell`**
- Summary strip: opportunity count, total indicative annual value, split by statutory
  vs commercial. Expect roughly 70 statutory opportunities worth about ₹16.79L from
  rules R1–R8 on the seed data.
- Ranked table, sortable by value, priority, and statutory flag
- Row click opens a detail panel: current sub-services held, tenure, the rule that fired,
  the trigger condition, the indicative fee
- Below: locked data context, editable instruction, **Generate Recommendation**
- Output card: pitch angle, 2–3 talking points tied to this client's data, a ready-to-send
  opening message, and timing (ideally alongside a compliance deadline the client already has)

---

### Module 3: Lead Conversion Planner (AI)

**Lead scoring (deterministic).** Score open leads out of 100:

| Component | Weight | Logic |
|-----------|--------|-------|
| Estimated value | 25 | Scaled against the highest-value open lead |
| **Urgency** | 20 | Immediate 20, This month 14, This quarter 7, Just exploring 2, blank 5 |
| Stage | 20 | Qualified 20, Contacted 12, New 8 |
| Recency | 20 | Full marks under 7 days since last contact, decaying to 0 at 30 days. New leads score on days since enquiry instead. |
| Source and capture quality | 15 | Referral 15, Walk-in 13, Website Direct 11, LinkedIn 10, Google Search 8, Instagram 6. Subtract 5 if `chatbot_completion` is Partial. |

Buckets: Hot 70+, Warm 40–69, Cold below 40.

Two rules that override the score:
- `existing_ca_status` = considering a switch → surface as a **switching lead** regardless
  of bucket. Different conversation, different objection.
- `consent_to_contact` = No → exclude from all outreach lists entirely and show why.
  A tool that recommends calling someone who declined contact is a liability.

**Screen `/leads/conversion`**
- Hot / Warm / Cold groups with counts and pipeline value each
- **Stale leads** callout: open, untouched 14+ days, highest value first
- **Partial captures** callout: chatbot sessions that dropped off. These convert at zero
  in the seed data, so the recommended action is a callback, not an email.
- Lead selection opens the planner with a visible score breakdown. Show all five
  components. An unexplainable score is one nobody acts on.
- Locked data context, editable instruction, **Generate Conversion Plan**
- Output: channel and timing, the likely objection for that sub-service, a three-step
  follow-up sequence, a draft first message

---

### Module 4: Social vs Sales Alignment (AI)

**Computation (deterministic).** At **both** levels, category and sub-service:

```
attention_share = category_reach / total_reach
revenue_share   = category_revenue / total_revenue
alignment_gap   = attention_share - revenue_share
```

| Condition | Label |
|-----------|-------|
| gap > +0.10 | **Over-invested** — more attention than it earns |
| gap < −0.10 | **Under-served** — earns more than it gets attention for |
| High engagement rate, low lead volume | **Untapped demand** — audience responds, never asked to act |
| Low effort, low return | **Dormant** |

**Screen `/alignment`**
- **Attention vs Revenue** — grouped bar per category, one bar for share of reach, one
  for share of revenue. Incorporation at 45.5% reach against 5.7% revenue should be
  impossible to miss.
- **Engagement rate vs lead volume scatter** — one point per category, with the
  high-engagement/low-volume quadrant shaded and labelled as untapped demand. Virtual CFO
  sits there.
- **Alignment table** with category rows that **expand to sub-service rows**. This is what
  turns "post more about Virtual CFO" into "post about Fund-raise Support and Business
  Valuation, which have near-zero penetration and the highest engagement in the dataset."
- **Monthly trend** — engagements and leads per month, category filter
- One line under the trend chart: this is correlation, not attribution. There is no UTM
  or click-path tracking, so no post can be credited with any lead. Say it on screen and
  say it in the report.
- Locked data context, editable instruction, **Generate Social & Ad Strategy**
- Output: key misalignments, content reallocation with a rough ratio, one ad angle per
  priority sub-service, and what to measure over the next 30 days

---

## 7. Out of scope for the pilot

Roadmap items, not build items:

- The website chatbot itself (specified in `docs/CHATBOT_SPEC.md`)
- Google Sheets to Supabase sync via Apps Script
- Live social API integration (Meta Graph, LinkedIn)
- Authentication and role-based access
- Daily call-to-action feed
- Formal KPI target-setting framework
- Sending email or WhatsApp from inside the tool
- Any write path back to the database from the UI. The pilot is read-and-recommend only.

## 8. Success criteria

1. All four modules render live Supabase data with no console errors, including rows
   with blank fields from partial chatbot sessions.
2. The Overview shows roughly 4.8 average sub-services per active client against 2.9
   categories, making the penetration gap visible in one card.
3. The upsell engine surfaces roughly 70 statutory opportunities worth about ₹16.79L
   from rules R1–R8, verifiable against `docs/DATA_DICTIONARY.md`.
4. The alignment module identifies Incorporation as over-invested (+39.9 gap), Audit and
   GST as under-served (−27.9 and −23.7), and Virtual CFO as untapped demand (8.9%
   engagement, 6 leads, 50% conversion).
5. Category rows in the alignment table expand to sub-service rows.
6. Each AI module returns a usable recommendation in under ~10 seconds.
7. Deployed on Vercel and demonstrable in a 15-minute walkthrough.
