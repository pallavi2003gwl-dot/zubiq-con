# Chatbot Specification (reverse-built from `leads.csv`)

The chatbot is **not part of the pilot build**. It belongs to the scaling roadmap.
This document exists because the leads table was designed backwards from it: every
CHATBOT-tagged field in `docs/DATA_DICTIONARY.md` corresponds to a question below.
Designing the data first and the conversation second is what keeps the two in sync.

---

## Design principles

**1. Capture the phone number before qualifying, not after.**
The seed data shows leads who abandon the flow mid-way convert at zero, while those who
finish convert at 23%. If contact details come first, an abandoned session is still a
lead somebody can call. If they come last, an abandoned session is nothing. This single
ordering decision is worth more than any other feature in the bot.

**2. Ask turnover as a band, never as a number.**
Nobody types their revenue into a chat window. Almost everybody will tap a range.

**3. Two-level service selection, always.**
Category first, then sub-service. "GST" tells the firm nothing actionable. "GST annual
return and reconciliation" tells them who handles it, what it costs, and how urgent it is.

**4. Never quote a fee.**
The firm prices per engagement after scoping. The bot's job is to book the free first
consultation, which is already ZubiQ's stated offer on the website.

**5. Never give tax advice.**
A compliance question answered wrongly by a bot is a professional liability for a CA firm.
Anything substantive routes to a human. Say so plainly in the bot's opening line.

**6. Keep it under 9 questions.**
Two contact, two qualifying, two routing, two preference, one free-text.

---

## Conversation flow

| # | Question | Field captured | Type |
|---|----------|----------------|------|
| 0 | Greeting: what the bot can and cannot do, plus the free-consultation offer | — | Message |
| 1 | "What should I call you?" | `contact_name` | Text |
| 2 | "Best number to reach you on? Our team responds within one business day." | `phone` (required) | Phone |
| 3 | "And an email, in case we need to send documents?" | `email` | Email (skippable) |
| 4 | "What do you need help with?" | `service_category` | 6 buttons |
| 5 | "More specifically?" (options filtered by the category picked) | `sub_service_interest` | 5 buttons + "Not sure" |
| 6 | "Is this for you personally, or a business?" → if business, entity type | `entity_type`, `company_name` | Buttons + text |
| 7 | "Roughly what is the annual turnover?" (skipped for individuals) | `annual_turnover_band` | 4 buttons |
| 8 | "How soon do you need this handled?" | `urgency` | 4 buttons |
| 9 | "Are you working with a CA at the moment?" | `existing_ca_status` | 4 buttons |
| 10 | "Anything you would like the team to know before they call?" | `notes` | Free text, skippable |
| 11 | "How would you prefer we reach out, and when?" | `preferred_contact_mode`, `preferred_contact_time` | Buttons |
| 12 | Consent line and confirmation | `consent_to_contact` | Yes/No |

Captured silently, never asked:
`enquiry_date`, `source` (from the referrer), `city` (from the IP, confirmable),
`capture_method`, `chatbot_completion`.

Added by the firm afterwards, never by the bot:
`status`, `last_contact_date`, `assigned_to`.

---

## Routing rules the bot should apply immediately

These are the payoff for asking questions 5, 7, 8, and 9 at all.

| Condition | Action |
|-----------|--------|
| `urgency` = Immediate **and** category is GST, Taxation, or Audit | Flag as urgent, notify the assigned partner the same day. These are deadline-driven and a slow response loses the work outright. |
| `sub_service_interest` in Notices & Assessments, ITC Review & Litigation | Route straight to a partner. Litigation enquiries are high-value and time-bound. |
| `annual_turnover_band` = 10Cr+ | Flag for partner-level handling regardless of the service asked about. The enquiry is rarely the whole opportunity. |
| `existing_ca_status` = considering a switch | Flag as a switching lead. Different conversation entirely: the objection is transition risk, not price. |
| `sub_service_interest` = Fund-raise Support, Business Valuation, Investor & MIS | Flag as Virtual CFO. The seed data says these convert at 50% and almost never arrive. |
| Session abandoned after question 2 | Still write the lead with whatever was captured, mark `chatbot_completion` as Partial, and queue it for a callback. |

---

## Production data path (roadmap, not pilot)

```
Website chatbot
      ↓  on session end, complete or abandoned
Google Sheet (one row per session, columns exactly matching leads.csv)
      ↓  Apps Script, time-driven trigger every 15 minutes
Supabase leads table (upsert on lead_id)
      ↓
Dashboard Modules 1 and 3 pick it up on next load
```

Notes for whoever builds this later:

- The Google Sheet column order must match `leads.csv` exactly. Any drift breaks the sync
  silently, which is the worst kind of breakage.
- Upsert on `lead_id`, do not append. A visitor who returns and completes a previously
  abandoned session should update the existing row, not create a second one.
- The Apps Script must never overwrite `status`, `last_contact_date`, or `assigned_to`.
  Those are written by the firm inside the dashboard, and a sync that clobbers them will
  erase the team's work every fifteen minutes.
- Write a sync log somewhere visible. A pipeline nobody can see failing is a pipeline
  everybody trusts until the day it matters.

For the pilot, leads come from `data/leads.csv` and none of this is built.

---

## What to say in the report

This document is evidence for two report sections. Section 5 (Proposed AI Solution) can
cite the reverse-build method: the schema was designed first from what the analytics
modules need, then the conversation was derived from the schema, which is why every
question earns its place and nothing is asked that the dashboard cannot use. Section 7
(Scaling Plan) can cite the production data path above as the immediate next build after
the pilot, with the phone-number-first finding as a concrete design decision that came
out of the pilot data rather than out of an opinion.
