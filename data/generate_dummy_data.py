"""
Dummy data generator for the ZubiQ AI Marketing Recommendation Engine prototype.

v2: two-level service taxonomy (6 categories, 30 sub-services) and a leads table
built backwards from what a website chatbot can realistically capture.

Planted gaps are documented in docs/DATA_DICTIONARY.md. Do not change the seed
without updating that file, because the PRD success criteria reference these findings.

Run:  python3 generate_dummy_data.py
"""

import csv
import random
from datetime import date, timedelta

random.seed(63)

# ---------------------------------------------------------------- taxonomy
# (sub_service_id, category_id, category, sub_service_name, base_fee,
#  is_recurring, is_entry, is_statutory, trigger)
#
# is_entry     : clients typically arrive through this
# is_statutory : legally mandatory once a condition is met, which makes it the
#                most credible upsell hook a CA firm has
# trigger      : the condition that makes it relevant, used by the upsell rules

SUB_SERVICES = [
    # ---- Taxation
    ("SS0101", "SVC01", "Taxation", "Income Tax Return Filing", 12000, "Yes", "Yes", "Yes", "All assessees with taxable income"),
    ("SS0102", "SVC01", "Taxation", "Advance Tax Planning", 15000, "Yes", "No", "Yes", "Tax liability above Rs 10,000 in a year"),
    ("SS0103", "SVC01", "Taxation", "TDS / TCS Compliance", 18000, "Yes", "No", "Yes", "Any business making specified payments"),
    ("SS0104", "SVC01", "Taxation", "Income Tax Notices & Assessments", 25000, "No", "Yes", "No", "On receipt of a departmental notice"),
    ("SS0105", "SVC01", "Taxation", "NRI Taxation & Capital Gains", 22000, "Yes", "Yes", "No", "NRI status or asset sale in the year"),
    # ---- GST
    ("SS0201", "SVC02", "GST", "GST Registration", 6000, "No", "Yes", "Yes", "Turnover crosses the registration threshold"),
    ("SS0202", "SVC02", "GST", "Monthly / Quarterly GST Returns", 24000, "Yes", "Yes", "Yes", "Any GST-registered entity"),
    ("SS0203", "SVC02", "GST", "GST Annual Return & Reconciliation", 20000, "Yes", "No", "Yes", "GST turnover above Rs 2 crore"),
    ("SS0204", "SVC02", "GST", "E-invoicing & E-way Bill Setup", 14000, "No", "No", "Yes", "Turnover above the e-invoicing threshold"),
    ("SS0205", "SVC02", "GST", "ITC Review & GST Litigation Support", 30000, "No", "No", "No", "ITC mismatch or departmental notice"),
    # ---- Bookkeeping
    ("SS0301", "SVC03", "Bookkeeping", "Monthly Books Closure", 36000, "Yes", "No", "No", "Any entity maintaining books"),
    ("SS0302", "SVC03", "Bookkeeping", "Financial Statement Preparation", 20000, "Yes", "No", "Yes", "All companies and LLPs annually"),
    ("SS0303", "SVC03", "Bookkeeping", "Payroll Processing", 30000, "Yes", "No", "No", "Entities with salaried employees"),
    ("SS0304", "SVC03", "Bookkeeping", "Accounts Payable / Receivable", 24000, "Yes", "No", "No", "Businesses with credit cycles"),
    ("SS0305", "SVC03", "Bookkeeping", "Bank Reconciliation", 12000, "Yes", "No", "No", "Any entity with active bank accounts"),
    # ---- Incorporation
    ("SS0401", "SVC04", "Incorporation", "Private Limited / OPC Registration", 18000, "No", "Yes", "No", "New business formation"),
    ("SS0402", "SVC04", "Incorporation", "LLP Registration", 14000, "No", "Yes", "No", "New partnership formation"),
    ("SS0403", "SVC04", "Incorporation", "ROC Annual Filings", 16000, "Yes", "No", "Yes", "Every registered company and LLP, every year"),
    ("SS0404", "SVC04", "Incorporation", "DIN / DSC & Statutory Registers", 8000, "Yes", "No", "Yes", "All companies with directors"),
    ("SS0405", "SVC04", "Incorporation", "Startup India Recognition", 20000, "No", "No", "No", "Eligible DPIIT startups"),
    # ---- Audit
    ("SS0501", "SVC05", "Audit", "Statutory Audit", 60000, "Yes", "No", "Yes", "All private limited companies"),
    ("SS0502", "SVC05", "Audit", "Tax Audit u/s 44AB", 45000, "Yes", "No", "Yes", "Business turnover above Rs 1 crore"),
    ("SS0503", "SVC05", "Audit", "Internal Audit", 55000, "Yes", "No", "No", "Larger entities seeking process control"),
    ("SS0504", "SVC05", "Audit", "Stock & Inventory Audit", 35000, "Yes", "No", "No", "Inventory-heavy businesses"),
    ("SS0505", "SVC05", "Audit", "Due Diligence", 75000, "No", "No", "No", "Fundraise, acquisition, or investor entry"),
    # ---- Virtual CFO
    ("SS0601", "SVC06", "Virtual CFO", "Budgeting & Forecasting", 60000, "Yes", "No", "No", "Growth-stage businesses planning ahead"),
    ("SS0602", "SVC06", "Virtual CFO", "Business Valuation", 50000, "No", "Yes", "No", "Fundraise, ESOP, or transfer of shares"),
    ("SS0603", "SVC06", "Virtual CFO", "Fund-raise Support", 90000, "No", "Yes", "No", "Companies raising external capital"),
    ("SS0604", "SVC06", "Virtual CFO", "Investor & MIS Reporting", 72000, "Yes", "No", "No", "Companies with external investors"),
    ("SS0605", "SVC06", "Virtual CFO", "Working Capital Planning", 48000, "Yes", "No", "No", "Businesses with a stretched cash cycle"),
]

CATEGORIES = [
    ("SVC01", "Taxation", "Income Tax & ITR Filing"),
    ("SVC02", "GST", "GST Advisory & Compliance"),
    ("SVC03", "Bookkeeping", "Accounting & Bookkeeping"),
    ("SVC04", "Incorporation", "Company Incorporation & ROC"),
    ("SVC05", "Audit", "Audit & Assurance"),
    ("SVC06", "Virtual CFO", "Virtual CFO & Advisory"),
]

SS = {s[0]: s for s in SUB_SERVICES}

INDUSTRIES = ["IT & Software", "E-commerce & D2C", "Manufacturing", "Real Estate",
              "Healthcare", "Education", "Logistics", "Retail & Trading",
              "Professional Services", "Hospitality"]
ENTITY_TYPES = ["Private Limited", "LLP", "Proprietorship", "Partnership", "Individual / HUF"]
CITIES = ["Noida", "Greater Noida", "Delhi", "Gurugram", "Ghaziabad", "Faridabad"]
BANDS = ["Under 50L", "50L - 2Cr", "2Cr - 10Cr", "10Cr+"]
OWNERS = ["Satyam Gahoi", "Ritika Sharma", "Amit Verma", "Neha Bansal"]

FIRST = ["Rahul", "Priya", "Arjun", "Sneha", "Vikram", "Anjali", "Karan", "Divya",
         "Rohit", "Meera", "Sandeep", "Pooja", "Nikhil", "Shreya", "Manish",
         "Kavita", "Tarun", "Ishita", "Gaurav", "Ananya", "Deepak", "Ritu",
         "Harsh", "Nidhi", "Varun", "Swati", "Mohit", "Preeti", "Akash", "Sunita",
         "Rajat", "Simran", "Aditya", "Neelam", "Sahil"]
LAST = ["Sharma", "Gupta", "Singh", "Aggarwal", "Kapoor", "Mehta", "Jain", "Bansal",
        "Chopra", "Malhotra", "Sethi", "Tandon", "Rastogi", "Khanna", "Arora"]
CO_A = ["Apex", "Nimbus", "Vertex", "Crestline", "Orbit", "Sable", "Fernway",
        "Northgate", "Brightpath", "Cobalt", "Ironwood", "Trinity", "Kalpvriksh",
        "Sanchay", "Udaan", "Prakhar", "Meridian", "Lodestar", "Rivergate", "Quill",
        "Anvaya", "Shubham", "Terrace", "Halcyon", "Pinewood", "Saarthi", "Bluegrass",
        "Everline", "Mandala", "Ashwath"]
CO_B = ["Technologies", "Ventures", "Industries", "Solutions", "Retail", "Logistics",
        "Labs", "Enterprises", "Healthcare", "Infra", "Traders", "Exports",
        "Systems", "Foods", "Interiors"]

START, END = date(2026, 4, 1), date(2026, 9, 15)


def rdate(a, b):
    return a + timedelta(days=random.randint(0, (b - a).days))


def money(x):
    return int(round(x / 500.0) * 500)


def chance(p):
    return random.random() < p


# ---------------------------------------------------------------- clients

clients, used = [], set()
for i in range(1, 51):
    entity = random.choices(ENTITY_TYPES, weights=[38, 16, 20, 12, 14])[0]
    if entity == "Individual / HUF":
        name = f"{random.choice(FIRST)} {random.choice(LAST)}"
        band, industry = "NA (Individual)", "Professional Services"
    else:
        while True:
            name = f"{random.choice(CO_A)} {random.choice(CO_B)}"
            if name not in used:
                used.add(name)
                break
        band = random.choices(BANDS, weights=[28, 34, 26, 12])[0]
        industry = random.choice(INDUSTRIES)
    clients.append({
        "client_id": f"CL{i:03d}",
        "client_name": name,
        "industry": industry,
        "entity_type": entity,
        "city": random.choice(CITIES),
        "annual_turnover_band": band,
        "onboarded_date": rdate(date(2021, 1, 1), date(2026, 8, 1)).isoformat(),
        "relationship_owner": random.choice(OWNERS),
        "status": "Dormant" if chance(0.10) else "Active",
    })

# ---------------------------------------------------------------- engagements
#
# Planted sub-service gaps. Each is a statutory or near-statutory obligation the
# client almost certainly needs but has not bought from ZubiQ. This is the whole
# point of the sub-service layer: at category level "has GST" looks complete,
# at sub-service level the missing annual return is visible.
#
#   ITR filing         -> no Advance Tax Planning           (very common)
#   GST returns        -> no Annual Return & Reconciliation (mandatory above 2Cr)
#   GST returns        -> no E-invoicing setup              (mandatory above threshold)
#   Incorporation done -> no ROC Annual Filings             (mandatory, every year)
#   Incorporation done -> no DIN/DSC & Statutory Registers  (mandatory)
#   Books closure      -> no Financial Statement Prep       (mandatory for Cos/LLPs)
#   Pvt Ltd            -> no Statutory Audit                (mandatory for all Pvt Ltd)
#   Turnover > 1Cr     -> no Tax Audit u/s 44AB             (mandatory)
#   Any VCFO client    -> shallow, only one sub-service of five

engagements, eid = [], 1


def add(client, ss_id, mult=1.0):
    global eid
    s = SS[ss_id]
    engagements.append({
        "engagement_id": f"EN{eid:04d}",
        "client_id": client["client_id"],
        "sub_service_id": ss_id,
        "service_id": s[1],
        "service_category": s[2],
        "sub_service_name": s[3],
        "start_date": rdate(date(2021, 6, 1), END).isoformat(),
        "annual_fee_inr": money(s[4] * mult * random.uniform(0.8, 1.45)),
        "billing_frequency": "Annual" if s[5] == "Yes" else "One-time",
        "status": "Active" if client["status"] == "Active" else "Lapsed",
    })
    eid += 1


BAND_MULT = {"Under 50L": 0.8, "50L - 2Cr": 1.0, "2Cr - 10Cr": 1.3,
             "10Cr+": 1.7, "NA (Individual)": 0.7}

for c in clients:
    e, band = c["entity_type"], c["annual_turnover_band"]
    m = BAND_MULT[band]
    big = band in ("2Cr - 10Cr", "10Cr+")

    if e == "Individual / HUF":
        add(c, "SS0101", m)
        if chance(0.22):
            add(c, "SS0102", m)          # advance tax gap
        if chance(0.25):
            add(c, "SS0105", m)
        if chance(0.20):
            add(c, "SS0104", m)
        continue

    # GST: almost everyone has returns, few have the annual return or e-invoicing
    add(c, "SS0202", m)
    if chance(0.35):
        add(c, "SS0201", m)
    if big and chance(0.30):
        add(c, "SS0203", m)              # annual return gap, mandatory above 2Cr
    if big and chance(0.22):
        add(c, "SS0204", m)              # e-invoicing gap
    if chance(0.18):
        add(c, "SS0205", m)

    # Taxation
    if chance(0.72):
        add(c, "SS0101", m)
        if chance(0.24):
            add(c, "SS0102", m)          # advance tax gap, the widest one
    if chance(0.34):
        add(c, "SS0103", m)

    # Bookkeeping
    if chance(0.42):
        add(c, "SS0301", m)
        if chance(0.38):
            add(c, "SS0302", m)          # financial statement gap
        if chance(0.30):
            add(c, "SS0303", m)
        if chance(0.26):
            add(c, "SS0304", m)
        if chance(0.44):
            add(c, "SS0305", m)

    # Incorporation and the ROC gap, the single most defensible upsell in the data
    if e in ("Private Limited", "LLP") and chance(0.46):
        add(c, "SS0401" if e == "Private Limited" else "SS0402", m)
        if chance(0.30):
            add(c, "SS0403", m)          # ROC annual filings gap
        if chance(0.26):
            add(c, "SS0404", m)
        if chance(0.16):
            add(c, "SS0405", m)
    elif e in ("Private Limited", "LLP") and chance(0.34):
        add(c, "SS0403", m)              # ROC only, incorporated elsewhere

    # Audit
    if e == "Private Limited" and chance(0.48):
        add(c, "SS0501", m)              # statutory audit gap for the other half
    if big and chance(0.40):
        add(c, "SS0502", m)              # 44AB gap
    if band == "10Cr+" and chance(0.30):
        add(c, "SS0503", m)
    if c["industry"] in ("Manufacturing", "Retail & Trading", "Logistics") and chance(0.28):
        add(c, "SS0504", m)
    if chance(0.08):
        add(c, "SS0505", m)

    # Virtual CFO, deliberately shallow: whoever has it usually has only one of five
    if band == "10Cr+" and chance(0.42):
        add(c, random.choice(["SS0601", "SS0604", "SS0605"]), m)
        if chance(0.18):
            add(c, random.choice(["SS0602", "SS0603"]), m)
    elif band == "2Cr - 10Cr" and chance(0.16):
        add(c, random.choice(["SS0601", "SS0605"]), m)

# ---------------------------------------------------------------- leads
#
# Built backwards from a chatbot. Every field below is tagged in
# docs/DATA_DICTIONARY.md as either CHATBOT (the bot can ask it) or
# INTERNAL (added by the firm after the lead lands).
#
# Planted funnel signals:
#   Incorporation  -> highest volume, worst conversion
#   Virtual CFO    -> tiny volume, best conversion, best social engagement
#   GST            -> healthy funnel, near-invisible on social
#   Partial chatbot completions convert far worse than complete ones

LEAD_MIX = (
    ["SS0401"] * 11 + ["SS0402"] * 6 + ["SS0405"] * 4 + ["SS0403"] * 3 +   # Incorporation 24
    ["SS0202"] * 7 + ["SS0201"] * 5 + ["SS0205"] * 3 + ["SS0203"] * 2 +    # GST 17
    ["SS0101"] * 8 + ["SS0104"] * 4 + ["SS0105"] * 3 + ["SS0102"] * 1 +    # Taxation 16
    ["SS0301"] * 5 + ["SS0303"] * 3 + ["SS0302"] * 2 +                     # Bookkeeping 10
    ["SS0502"] * 4 + ["SS0501"] * 2 + ["SS0505"] * 1 +                     # Audit 7
    ["SS0603"] * 3 + ["SS0602"] * 2 + ["SS0604"] * 1                       # Virtual CFO 6
)

STATUS_BY_CAT = {
    "Incorporation": ["New", "Contacted", "Contacted", "Lost", "Lost", "Qualified", "Converted", "Converted"],
    "GST":           ["Converted", "Converted", "Qualified", "Qualified", "Contacted", "New", "Lost"],
    "Taxation":      ["Converted", "Converted", "Qualified", "Contacted", "Contacted", "New", "Lost"],
    "Bookkeeping":   ["Qualified", "Contacted", "Converted", "New", "Lost"],
    "Audit":         ["Qualified", "Converted", "Contacted", "New"],
    "Virtual CFO":   ["Converted", "Qualified", "Qualified", "Contacted", "New"],
}

URGENCY = ["Immediate (deadline within 15 days)", "This month",
           "This quarter", "Just exploring"]
CA_STATUS = ["No CA currently", "Have a CA, considering a switch",
             "Have a CA, need a second opinion", "Prefer not to say"]
CONTACT_MODE = ["WhatsApp", "Phone call", "Email"]
CONTACT_TIME = ["Morning (10am - 1pm)", "Afternoon (1pm - 5pm)", "Evening (5pm - 8pm)"]
SOURCE = ["Website Direct", "Google Search", "Instagram", "LinkedIn", "Referral", "Walk-in"]
CAPTURE = ["Website Chatbot", "Website Chatbot", "Website Chatbot",
           "Website Contact Form", "Phone Call", "In Person"]

NOTES = {
    "SS0401": ["Two co-founders, want to register before raising a friends-and-family round",
               "Comparing us against an online filing portal, asked why the fee differs",
               "Wants the company registered before the new financial year"],
    "SS0402": ["Consultancy with three partners, wants limited liability",
               "Asked whether LLP or Pvt Ltd is better for a services business"],
    "SS0405": ["Wants DPIIT recognition for the tax holiday",
               "Applying for a government tender, needs startup recognition"],
    "SS0403": ["Missed last year's ROC filing, worried about penalties"],
    "SS0202": ["Current CA files late every month, getting notices",
               "Needs GSTR-1 and 3B from next quarter onward",
               "Multi-state registration, unsure how returns work"],
    "SS0201": ["Crossed the turnover threshold last quarter, needs to register",
               "Starting e-commerce sales, told registration is mandatory"],
    "SS0205": ["ITC mismatch of around 4 lakh, department has issued a notice",
               "Show cause notice received, needs representation"],
    "SS0203": ["Turnover crossed 2 crore, told we need the annual return"],
    "SS0101": ["Salaried with capital gains from a flat sale, first time using a CA",
               "Two Form 16s this year plus freelance income",
               "Filed on my own last year and got a mismatch notice"],
    "SS0104": ["Received a 143(1) intimation with a demand", "Scrutiny notice for AY 2024-25"],
    "SS0105": ["NRI in Dubai, rental income and an NRO account in India",
               "Selling inherited property, need TDS and capital gains handled"],
    "SS0102": ["Paid interest under 234B last year, want to plan quarterly this time"],
    "SS0301": ["In-house accountant resigned, books are two quarters behind",
               "Currently on spreadsheets, want to move to proper books"],
    "SS0303": ["Team of 22, payroll and PF are taking too much of my time"],
    "SS0302": ["Bank has asked for audited financials for a working capital limit"],
    "SS0502": ["Turnover crossed 1 crore this year, told a tax audit applies"],
    "SS0501": ["Pvt Ltd since 2023, never had a statutory audit done"],
    "SS0505": ["Investor doing diligence on us, need our side prepared"],
    "SS0603": ["Pre-seed round, need a data room and financial model",
               "Raising from an angel network, no finance person in-house"],
    "SS0602": ["Issuing ESOPs, need a valuation certificate",
               "Buying out a co-founder, need a fair value"],
    "SS0604": ["Investors want monthly MIS, we send them a spreadsheet nobody reads"],
}

leads = []
random.shuffle(LEAD_MIX)
for i, ss_id in enumerate(LEAD_MIX, start=1):
    s = SS[ss_id]
    cat = s[2]
    entity = random.choices(ENTITY_TYPES, weights=[34, 16, 22, 12, 16])[0]
    if entity == "Individual / HUF":
        company, industry, band = "-", "Professional Services", "NA (Individual)"
    else:
        company = f"{random.choice(CO_A)} {random.choice(CO_B)}"
        industry = random.choice(INDUSTRIES)
        band = random.choices(BANDS, weights=[36, 32, 22, 10])[0]

    capture = random.choice(CAPTURE)
    is_bot = capture == "Website Chatbot"
    complete = "Complete" if (not is_bot or chance(0.72)) else "Partial"

    status = random.choice(STATUS_BY_CAT[cat])
    if complete == "Partial" and status in ("Converted", "Qualified") and chance(0.6):
        status = random.choice(["Lost", "Contacted", "New"])

    enq = rdate(START, END)
    last = min(enq + timedelta(days=random.randint(0, 28)), END)

    fname, lname = random.choice(FIRST), random.choice(LAST)
    handle = f"{fname.lower()}.{lname.lower()}"
    domain = "gmail.com" if entity == "Individual / HUF" else \
        company.split()[0].lower() + ".co.in"

    urg = random.choices(URGENCY, weights=(
        [34, 30, 22, 14] if cat in ("Taxation", "GST", "Audit") else [16, 26, 32, 26]))[0]

    def maybe(v):
        return v if complete == "Complete" else ""

    leads.append({
        "lead_id": f"LD{i:03d}",
        "enquiry_date": enq.isoformat(),
        "contact_name": f"{fname} {lname}",
        "phone": f"+91 9{random.randint(10000000, 99999999)}",
        "email": f"{handle}@{domain}",
        "company_name": company,
        "entity_type": entity,
        "industry": industry,
        "city": random.choice(CITIES),
        "annual_turnover_band": maybe(band),
        "service_category": cat,
        "sub_service_interest": s[3],
        "sub_service_id": ss_id,
        "urgency": maybe(urg),
        "existing_ca_status": maybe(random.choice(CA_STATUS)),
        "preferred_contact_mode": maybe(random.choice(CONTACT_MODE)),
        "preferred_contact_time": maybe(random.choice(CONTACT_TIME)),
        "notes": maybe(random.choice(NOTES[ss_id])),
        "consent_to_contact": "Yes" if complete == "Complete" or chance(0.5) else "No",
        "source": random.choices(SOURCE, weights=[30, 22, 16, 14, 12, 6])[0],
        "capture_method": capture,
        "chatbot_completion": complete if is_bot else "NA",
        "status": status,
        "last_contact_date": last.isoformat() if status != "New" else "",
        "assigned_to": random.choice(OWNERS) if status != "New" else "",
        "estimated_value_inr": money(s[4] * BAND_MULT.get(band or "50L - 2Cr", 1.0)
                                     * random.uniform(0.85, 1.3)),
    })

# ---------------------------------------------------------------- social posts
#
# Tagged at sub-service level so Module 4 can recommend a topic, not just a category.
# Category-level profile is preserved from v1 so the planted findings still hold.

SOCIAL_PLAN = {
    # Incorporation: over-invested, heavy posting, weak return
    "SS0401": (13, (3000, 7400), (0.018, 0.034), (0.010, 0.021)),
    "SS0402": (8, (2600, 6200), (0.017, 0.032), (0.009, 0.019)),
    "SS0405": (7, (2400, 5800), (0.020, 0.038), (0.011, 0.023)),
    "SS0403": (2, (900, 2000), (0.014, 0.026), (0.006, 0.013)),
    # Taxation: high volume, moderate return
    "SS0101": (12, (2400, 6200), (0.024, 0.046), (0.012, 0.027)),
    "SS0105": (6, (1900, 4600), (0.028, 0.050), (0.013, 0.030)),
    "SS0104": (4, (1700, 3900), (0.026, 0.044), (0.012, 0.026)),
    "SS0102": (2, (1400, 3000), (0.030, 0.052), (0.014, 0.031)),
    # Virtual CFO: untapped demand, best engagement, barely any leads
    "SS0603": (5, (2000, 4400), (0.070, 0.120), (0.034, 0.060)),
    "SS0601": (4, (1800, 4000), (0.060, 0.105), (0.029, 0.052)),
    "SS0604": (3, (1700, 3800), (0.058, 0.100), (0.028, 0.050)),
    "SS0602": (2, (1600, 3400), (0.064, 0.108), (0.030, 0.055)),
    # Bookkeeping: modest effort, modest return
    "SS0301": (5, (1000, 2500), (0.020, 0.040), (0.008, 0.020)),
    "SS0303": (3, (900, 2200), (0.022, 0.042), (0.009, 0.021)),
    "SS0305": (2, (800, 1900), (0.018, 0.034), (0.007, 0.017)),
    # GST: under-served, highest revenue, almost no content
    "SS0202": (3, (1200, 2900), (0.032, 0.056), (0.016, 0.031)),
    "SS0201": (2, (1100, 2600), (0.030, 0.052), (0.015, 0.029)),
    "SS0205": (1, (1000, 2400), (0.034, 0.058), (0.017, 0.032)),
    # Audit: dormant, second-highest revenue, three posts in six months
    "SS0502": (2, (600, 1500), (0.015, 0.030), (0.006, 0.014)),
    "SS0501": (1, (600, 1400), (0.014, 0.028), (0.006, 0.013)),
}

PLATFORMS = ["Instagram", "Instagram", "LinkedIn", "LinkedIn", "Facebook"]
FORMATS = ["Reel", "Carousel", "Static Post", "Story", "Article"]

TOPIC_STEMS = {
    "SS0401": ["Register a Pvt Ltd in 10 days", "Pvt Ltd vs OPC: which fits you",
               "Documents you need to incorporate"],
    "SS0402": ["LLP vs Pvt Ltd for a services firm", "LLP registration, start to finish"],
    "SS0405": ["Startup India benefits explained", "DPIIT recognition in 6 steps"],
    "SS0403": ["The ROC filing everyone forgets", "Penalties for a missed ROC return"],
    "SS0101": ["New vs Old regime: which saves more", "ITR deadline reminder",
               "Filing with two Form 16s"],
    "SS0105": ["NRI selling property in India", "NRO vs NRE: the tax difference"],
    "SS0104": ["Got a 143(1) notice? Read this", "What a scrutiny notice really means"],
    "SS0102": ["Why you paid interest under 234B", "Advance tax in four instalments"],
    "SS0603": ["What investors check before a term sheet", "Building a data room in 2 weeks"],
    "SS0601": ["Cash runway: the only number that matters", "A budget your team will use"],
    "SS0604": ["Reading your MIS in 5 minutes", "The investor update format that works"],
    "SS0602": ["What your company is actually worth", "Valuation before an ESOP grant"],
    "SS0301": ["Why your books fall behind every quarter", "Spreadsheets to real books"],
    "SS0303": ["Payroll and PF without the headache"],
    "SS0305": ["Bank reconciliation in plain English"],
    "SS0202": ["GSTR-3B filing checklist", "Late GST filing: what it costs"],
    "SS0201": ["When GST registration becomes mandatory"],
    "SS0205": ["ITC mismatch: how to fix it"],
    "SS0502": ["Tax audit u/s 44AB: who it applies to"],
    "SS0501": ["What statutory auditors actually check"],
}

social, pid = [], 1
for ss_id, (n, rr, er, cr) in SOCIAL_PLAN.items():
    s = SS[ss_id]
    for _ in range(n):
        reach = random.randint(*rr)
        engs = int(reach * random.uniform(*er))
        clicks = int(reach * random.uniform(*cr))
        paid = chance(0.22)
        social.append({
            "post_id": f"SP{pid:03d}",
            "post_date": rdate(START, END).isoformat(),
            "platform": random.choice(PLATFORMS),
            "service_category": s[2],
            "sub_service_id": ss_id,
            "sub_service_name": s[3],
            "content_format": random.choice(FORMATS),
            "topic": random.choice(TOPIC_STEMS[ss_id]),
            "reach": reach,
            "impressions": int(reach * random.uniform(1.15, 1.75)),
            "engagements": engs,
            "link_clicks": clicks,
            "saves": int(engs * random.uniform(0.05, 0.22)),
            "is_paid": "Yes" if paid else "No",
            "spend_inr": money(random.uniform(1500, 9000)) if paid else 0,
        })
        pid += 1

social.sort(key=lambda r: r["post_date"])

# ---------------------------------------------------------------- write


def write(fname, rows, fields=None):
    fields = fields or list(rows[0].keys())
    with open(fname, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"{fname}: {len(rows)} rows")


write("service_categories.csv",
      [{"service_id": c[0], "service_category": c[1], "category_name": c[2]}
       for c in CATEGORIES])

write("sub_services.csv",
      [{"sub_service_id": s[0], "service_id": s[1], "service_category": s[2],
        "sub_service_name": s[3], "base_annual_fee_inr": s[4],
        "is_recurring": s[5], "is_entry_service": s[6],
        "is_statutory": s[7], "relevance_trigger": s[8]} for s in SUB_SERVICES])

write("clients.csv", clients)
write("engagements.csv", engagements)
write("leads.csv", leads)
write("social_posts.csv", social)
