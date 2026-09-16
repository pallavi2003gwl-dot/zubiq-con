"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterSelect } from "@/components/FilterSelect";
import { Drawer } from "@/components/Drawer";
import { Chip } from "@/components/Chip";
import { formatINR, formatDate } from "@/lib/format";
import { buildClientServiceSummaries } from "@/lib/serviceMix";
import type { Client, Engagement, SubService } from "@/lib/types";

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
}

export function ClientsTable({
  clients,
  engagements,
  subServices,
}: {
  clients: Client[];
  engagements: Engagement[];
  subServices: SubService[];
}) {
  const [industry, setIndustry] = useState("");
  const [entityType, setEntityType] = useState("");
  const [city, setCity] = useState("");
  const [turnoverBand, setTurnoverBand] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [subServiceHeld, setSubServiceHeld] = useState("");
  const [subServiceMissing, setSubServiceMissing] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const summaries = useMemo(() => buildClientServiceSummaries(clients, engagements), [clients, engagements]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (industry && c.industry !== industry) return false;
      if (entityType && c.entity_type !== entityType) return false;
      if (city && c.city !== city) return false;
      if (turnoverBand && c.annual_turnover_band !== turnoverBand) return false;
      if (status && c.status !== status) return false;
      if (owner && c.relationship_owner !== owner) return false;
      const summary = summaries.get(c.client_id);
      if (subServiceHeld && !summary?.subServiceIds.has(subServiceHeld)) return false;
      if (subServiceMissing && summary?.subServiceIds.has(subServiceMissing)) return false;
      return true;
    });
  }, [clients, industry, entityType, city, turnoverBand, status, owner, subServiceHeld, subServiceMissing, summaries]);

  const columns: Column<Client>[] = [
    { key: "name", header: "Client", accessor: (c) => c.client_name, sortValue: (c) => c.client_name },
    { key: "industry", header: "Industry", accessor: (c) => c.industry, sortValue: (c) => c.industry },
    { key: "entity", header: "Entity type", accessor: (c) => c.entity_type, sortValue: (c) => c.entity_type },
    { key: "city", header: "City", accessor: (c) => c.city, sortValue: (c) => c.city },
    {
      key: "turnover",
      header: "Turnover",
      accessor: (c) => c.annual_turnover_band,
      sortValue: (c) => c.annual_turnover_band,
    },
    {
      key: "services",
      header: "Sub-services",
      accessor: (c) => `${summaries.get(c.client_id)?.subServiceIds.size ?? 0} of 30`,
      sortValue: (c) => summaries.get(c.client_id)?.subServiceIds.size ?? 0,
      align: "right",
    },
    {
      key: "status",
      header: "Status",
      accessor: (c) => (
        <Chip tone={c.status === "Active" ? "navy" : "muted"}>{c.status}</Chip>
      ),
      sortValue: (c) => c.status,
    },
    { key: "owner", header: "Owner", accessor: (c) => c.relationship_owner, sortValue: (c) => c.relationship_owner },
  ];

  const selectedSummary = selectedClient ? summaries.get(selectedClient.client_id) : undefined;
  const selectedEngagements = selectedClient
    ? engagements.filter((e) => e.client_id === selectedClient.client_id && e.status === "Active")
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white shadow-sm p-3">
        <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={uniqueSorted(clients.map((c) => c.industry))} />
        <FilterSelect label="Entity type" value={entityType} onChange={setEntityType} options={uniqueSorted(clients.map((c) => c.entity_type))} />
        <FilterSelect label="City" value={city} onChange={setCity} options={uniqueSorted(clients.map((c) => c.city))} />
        <FilterSelect label="Turnover band" value={turnoverBand} onChange={setTurnoverBand} options={uniqueSorted(clients.map((c) => c.annual_turnover_band))} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={uniqueSorted(clients.map((c) => c.status))} />
        <FilterSelect label="Owner" value={owner} onChange={setOwner} options={uniqueSorted(clients.map((c) => c.relationship_owner))} />
        <FilterSelect
          label="Sub-service held"
          value={subServiceHeld}
          onChange={setSubServiceHeld}
          options={subServices.map((s) => ({ value: s.sub_service_id, label: s.sub_service_name }))}
        />
        <FilterSelect
          label="Sub-service missing"
          value={subServiceMissing}
          onChange={setSubServiceMissing}
          options={subServices.map((s) => ({ value: s.sub_service_id, label: s.sub_service_name }))}
        />
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} of {clients.length} clients
      </p>

      <DataTable
        rows={filtered}
        rowKey={(c) => c.client_id}
        columns={columns}
        onRowClick={setSelectedClient}
        emptyMessage="No clients match the current filters."
      />

      <Drawer open={!!selectedClient} onClose={() => setSelectedClient(null)} title={selectedClient?.client_name ?? ""}>
        {selectedClient ? (
          <div className="flex flex-col gap-5 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-slate-500">Industry</dt>
              <dd className="text-slate-900">{selectedClient.industry}</dd>
              <dt className="text-slate-500">Entity type</dt>
              <dd className="text-slate-900">{selectedClient.entity_type}</dd>
              <dt className="text-slate-500">City</dt>
              <dd className="text-slate-900">{selectedClient.city}</dd>
              <dt className="text-slate-500">Turnover band</dt>
              <dd className="text-slate-900">{selectedClient.annual_turnover_band}</dd>
              <dt className="text-slate-500">Client since</dt>
              <dd className="text-slate-900">{formatDate(selectedClient.onboarded_date)}</dd>
              <dt className="text-slate-500">Owner</dt>
              <dd className="text-slate-900">{selectedClient.relationship_owner}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Chip tone={selectedClient.status === "Active" ? "navy" : "muted"}>{selectedClient.status}</Chip>
              </dd>
            </dl>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Sub-services held ({selectedSummary?.subServiceIds.size ?? 0} of 30, {selectedSummary?.categories.size ?? 0} of 6 categories)
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatINR(selectedSummary?.totalAnnualFeeInr ?? 0)} total annual fee
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {selectedEngagements.map((e) => (
                  <li key={e.engagement_id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-sm text-slate-900">{e.sub_service_name}</p>
                    <p className="text-xs text-slate-500">
                      {e.service_category} · since {formatDate(e.start_date)} · {formatINR(e.annual_fee_inr)}
                    </p>
                  </li>
                ))}
                {selectedEngagements.length === 0 ? (
                  <p className="text-sm text-slate-400">No active engagements.</p>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
