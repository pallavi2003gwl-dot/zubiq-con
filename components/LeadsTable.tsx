"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterSelect } from "@/components/FilterSelect";
import { Chip } from "@/components/Chip";
import { formatINR, formatDate, daysSince } from "@/lib/format";
import type { Lead } from "@/lib/types";

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
}

const OPEN_STATUSES = new Set(["New", "Contacted", "Qualified"]);

export function isStaleLead(lead: Lead): boolean {
  if (!OPEN_STATUSES.has(lead.status)) return false;
  const reference = lead.last_contact_date ?? lead.enquiry_date;
  const days = daysSince(reference);
  return days !== null && days >= 14;
}

function CaptureChip({ lead }: { lead: Lead }) {
  if (lead.chatbot_completion === "Partial") return <Chip tone="warm">Partial capture</Chip>;
  if (lead.chatbot_completion === "Complete") return <Chip tone="navy">Complete</Chip>;
  return <Chip tone="muted">{lead.capture_method ?? "Not captured"}</Chip>;
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [category, setCategory] = useState("");
  const [subService, setSubService] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [urgency, setUrgency] = useState("");
  const [captureMethod, setCaptureMethod] = useState("");
  const [chatbotCompletion, setChatbotCompletion] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (category && l.service_category !== category) return false;
      if (subService && l.sub_service_interest !== subService) return false;
      if (status && l.status !== status) return false;
      if (source && l.source !== source) return false;
      if (urgency && l.urgency !== urgency) return false;
      if (captureMethod && l.capture_method !== captureMethod) return false;
      if (chatbotCompletion && l.chatbot_completion !== chatbotCompletion) return false;
      if (dateFrom && l.enquiry_date < dateFrom) return false;
      if (dateTo && l.enquiry_date > dateTo) return false;
      return true;
    });
  }, [leads, category, subService, status, source, urgency, captureMethod, chatbotCompletion, dateFrom, dateTo]);

  const columns: Column<Lead>[] = [
    {
      key: "contact",
      header: "Contact",
      accessor: (l) => (
        <div>
          <p className="font-medium text-slate-900">{l.contact_name}</p>
          <p className="text-xs text-slate-400">{l.company_name && l.company_name !== "-" ? l.company_name : "Individual"}</p>
        </div>
      ),
      sortValue: (l) => l.contact_name,
    },
    {
      key: "interest",
      header: "Interest",
      accessor: (l) => (
        <div>
          <p className="text-slate-900">{l.sub_service_interest}</p>
          <p className="text-xs text-slate-400">{l.service_category}</p>
        </div>
      ),
      sortValue: (l) => l.service_category,
    },
    {
      key: "status",
      header: "Status",
      accessor: (l) => (
        <Chip tone={l.status === "Converted" ? "navy" : l.status === "Lost" ? "muted" : "warm"}>
          {l.status}
        </Chip>
      ),
      sortValue: (l) => l.status,
    },
    { key: "urgency", header: "Urgency", accessor: (l) => l.urgency ?? <Chip tone="muted">Not captured</Chip>, sortValue: (l) => l.urgency },
    { key: "source", header: "Source", accessor: (l) => l.source ?? "—", sortValue: (l) => l.source },
    { key: "capture", header: "Capture", accessor: (l) => <CaptureChip lead={l} /> },
    { key: "enquiry", header: "Enquiry date", accessor: (l) => formatDate(l.enquiry_date), sortValue: (l) => l.enquiry_date },
    {
      key: "lastContact",
      header: "Last contact",
      accessor: (l) => (l.last_contact_date ? formatDate(l.last_contact_date) : <Chip tone="muted">Not captured</Chip>),
      sortValue: (l) => l.last_contact_date,
    },
    {
      key: "value",
      header: "Est. value",
      accessor: (l) => formatINR(l.estimated_value_inr),
      sortValue: (l) => l.estimated_value_inr,
      align: "right",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white shadow-sm p-3">
        <FilterSelect label="Category" value={category} onChange={setCategory} options={uniqueSorted(leads.map((l) => l.service_category))} />
        <FilterSelect label="Sub-service" value={subService} onChange={setSubService} options={uniqueSorted(leads.map((l) => l.sub_service_interest))} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={uniqueSorted(leads.map((l) => l.status))} />
        <FilterSelect label="Source" value={source} onChange={setSource} options={uniqueSorted(leads.map((l) => l.source))} />
        <FilterSelect label="Urgency" value={urgency} onChange={setUrgency} options={uniqueSorted(leads.map((l) => l.urgency))} />
        <FilterSelect label="Capture method" value={captureMethod} onChange={setCaptureMethod} options={uniqueSorted(leads.map((l) => l.capture_method))} />
        <FilterSelect label="Chatbot completion" value={chatbotCompletion} onChange={setChatbotCompletion} options={uniqueSorted(leads.map((l) => l.chatbot_completion))} />
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Enquiry from
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-shadow focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-navy-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Enquiry to
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-shadow focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-navy-100"
          />
        </label>
      </div>

      <p className="flex items-center gap-3 text-xs text-slate-500">
        <span>{filtered.length} of {leads.length} leads</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-warm-600" /> Open and untouched 14+ days
        </span>
      </p>

      <DataTable
        rows={filtered}
        rowKey={(l) => l.lead_id}
        columns={columns}
        emptyMessage="No leads match the current filters."
        highlightRow={(l) => (isStaleLead(l) ? "bg-warm-50" : undefined)}
      />
    </div>
  );
}
