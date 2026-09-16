"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { Drawer } from "@/components/Drawer";
import { Chip } from "@/components/Chip";
import { AiPanel } from "@/components/AiPanel";
import { KpiCard } from "@/components/KpiCard";
import { formatINR, formatDate } from "@/lib/format";
import { buildUpsellDataContext } from "@/lib/upsellContext";
import type { UpsellOpportunity, UnderpenetratedFlag } from "@/lib/upsell";
import type { Client, Engagement, SubServiceAlignmentRow } from "@/lib/types";

export function UpsellTable({
  opportunities,
  flags,
  clients,
  engagements,
  subServiceAlignment,
  avgSubServices,
}: {
  opportunities: UpsellOpportunity[];
  flags: UnderpenetratedFlag[];
  clients: Client[];
  engagements: Engagement[];
  subServiceAlignment: SubServiceAlignmentRow[];
  avgSubServices: number;
}) {
  const [selected, setSelected] = useState<UpsellOpportunity | null>(null);
  const [statutoryOnly, setStatutoryOnly] = useState(false);

  const stats = useMemo(() => {
    const statutory = opportunities.filter((o) => o.isStatutory);
    const commercial = opportunities.filter((o) => !o.isStatutory);
    const sum = (list: UpsellOpportunity[]) => list.reduce((s, o) => s + o.indicativeAnnualFeeInr, 0);
    return {
      total: opportunities.length,
      totalValue: sum(opportunities),
      statutoryCount: statutory.length,
      statutoryValue: sum(statutory),
      commercialCount: commercial.length,
      commercialValue: sum(commercial),
    };
  }, [opportunities]);

  const rows = statutoryOnly ? opportunities.filter((o) => o.isStatutory) : opportunities;

  const columns: Column<UpsellOpportunity>[] = [
    {
      key: "client",
      header: "Client",
      accessor: (o) => o.client.client_name,
      sortValue: (o) => o.client.client_name,
    },
    {
      key: "service",
      header: "Missing sub-service",
      accessor: (o) => (
        <div>
          <p className="text-slate-900">{o.subService.sub_service_name}</p>
          <p className="text-xs text-slate-400">{o.subService.service_category}</p>
        </div>
      ),
      sortValue: (o) => o.subService.sub_service_name,
    },
    {
      key: "statutory",
      header: "Statutory",
      accessor: (o) => (
        <Chip tone={o.isStatutory ? "warm" : "muted"}>{o.isStatutory ? "Statutory" : "Commercial"}</Chip>
      ),
      sortValue: (o) => (o.isStatutory ? 1 : 0),
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (o) => o.priority,
      sortValue: (o) => (o.priority === "High" ? 1 : 0),
    },
    { key: "rule", header: "Rule", accessor: (o) => o.ruleId, sortValue: (o) => o.ruleId },
    {
      key: "fee",
      header: "Indicative fee",
      accessor: (o) => formatINR(o.indicativeAnnualFeeInr),
      sortValue: (o) => o.indicativeAnnualFeeInr,
      align: "right",
    },
  ];

  const dataContext = selected
    ? buildUpsellDataContext(selected, clients, engagements, subServiceAlignment, avgSubServices)
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total opportunities" value={String(stats.total)} subvalue={formatINR(stats.totalValue)} />
        <KpiCard
          label="Statutory"
          value={String(stats.statutoryCount)}
          subvalue={formatINR(stats.statutoryValue)}
          highlight
        />
        <KpiCard label="Commercial" value={String(stats.commercialCount)} subvalue={formatINR(stats.commercialValue)} />
      </div>

      {flags.length > 0 ? (
        <div className="rounded-lg border border-warm-700/30 bg-warm-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-warm-800">
            Under-penetrated, long-tenure accounts (R13)
          </p>
          <p className="mt-1 text-xs text-warm-800/80">
            Onboarded 18+ months ago, holding fewer than 3 of 30 sub-services — a relationship review, not a single
            service pitch.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {flags.map((f) => (
              <li key={f.client.client_id} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700">
                {f.client.client_name} — {f.subServicesHeld} of 30, {Math.floor(f.tenureMonths / 12)}y{" "}
                {f.tenureMonths % 12}m
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="flex w-fit items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={statutoryOnly}
          onChange={(e) => setStatutoryOnly(e.target.checked)}
          className="rounded border-slate-300"
        />
        Statutory only
      </label>

      <DataTable
        rows={rows}
        rowKey={(o) => `${o.client.client_id}-${o.subService.sub_service_id}-${o.ruleId}`}
        columns={columns}
        onRowClick={setSelected}
        emptyMessage="No opportunities match the current filter."
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.client.client_name} — ${selected.subService.sub_service_name}` : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5 text-sm">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-slate-500">Client since</dt>
              <dd className="text-slate-900">
                {formatDate(selected.client.onboarded_date)} ({selected.tenureMonths} mo)
              </dd>
              <dt className="text-slate-500">Rule triggered</dt>
              <dd className="text-slate-900">
                {selected.ruleId} — {selected.ruleDescription}
              </dd>
              <dt className="text-slate-500">Statutory</dt>
              <dd>
                <Chip tone={selected.isStatutory ? "warm" : "muted"}>
                  {selected.isStatutory ? "Yes — compliance exposure" : "No — commercial upside"}
                </Chip>
              </dd>
              <dt className="text-slate-500">Indicative fee</dt>
              <dd className="text-slate-900">{formatINR(selected.indicativeAnnualFeeInr)}</dd>
              <dt className="text-slate-500">Applies because</dt>
              <dd className="text-slate-900">{selected.subService.relevance_trigger}</dd>
            </dl>

            <AiPanel module="upsell" dataContext={dataContext} />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
