"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/Drawer";
import { Chip } from "@/components/Chip";
import { AiPanel } from "@/components/AiPanel";
import { KpiCard } from "@/components/KpiCard";
import { SectionHeading } from "@/components/SectionHeading";
import { formatINR, formatDate } from "@/lib/format";
import { buildConversionPrompt } from "@/lib/conversionContext";
import type { Bucket, ScoredLead } from "@/lib/leadScore";
import type { CategoryAlignmentRow, Lead } from "@/lib/types";

const BUCKET_TONE: Record<Bucket, "warm" | "navy" | "muted"> = {
  Hot: "warm",
  Warm: "navy",
  Cold: "muted",
};

function LeadCard({ scored, onClick }: { scored: ScoredLead; onClick: () => void }) {
  const { lead, score, bucket } = scored;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1 rounded-md border border-slate-100 bg-white p-3 text-left transition-colors hover:border-navy-700/40 hover:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{lead.contact_name}</p>
        <Chip tone={BUCKET_TONE[bucket]}>{score}</Chip>
      </div>
      <p className="text-xs text-slate-400">{lead.sub_service_interest}</p>
      <p className="text-xs text-slate-500">{formatINR(lead.estimated_value_inr)}</p>
    </button>
  );
}

export function ConversionBoard({
  scoredLeads,
  allLeads,
  categoryAlignment,
}: {
  scoredLeads: ScoredLead[];
  allLeads: Lead[];
  categoryAlignment: CategoryAlignmentRow[];
}) {
  const [selected, setSelected] = useState<ScoredLead | null>(null);

  const eligible = useMemo(() => scoredLeads.filter((s) => !s.excludedNoConsent), [scoredLeads]);
  const excluded = useMemo(() => scoredLeads.filter((s) => s.excludedNoConsent), [scoredLeads]);

  const buckets = useMemo(() => {
    const groups: Record<Bucket, ScoredLead[]> = { Hot: [], Warm: [], Cold: [] };
    for (const s of eligible) groups[s.bucket].push(s);
    for (const b of Object.keys(groups) as Bucket[]) groups[b].sort((a, b2) => b2.score - a.score);
    return groups;
  }, [eligible]);

  const stale = useMemo(
    () => eligible.filter((s) => s.isStale).sort((a, b) => b.lead.estimated_value_inr - a.lead.estimated_value_inr),
    [eligible]
  );
  const partial = useMemo(() => eligible.filter((s) => s.lead.chatbot_completion === "Partial"), [eligible]);
  const switching = useMemo(() => eligible.filter((s) => s.isSwitching), [eligible]);

  const defaultPrompt = selected ? buildConversionPrompt(selected, allLeads, categoryAlignment) : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["Hot", "Warm", "Cold"] as Bucket[]).map((b) => (
          <KpiCard
            key={b}
            label={b}
            value={String(buckets[b].length)}
            subvalue={formatINR(buckets[b].reduce((s, l) => s + l.lead.estimated_value_inr, 0)) + " pipeline"}
            highlight={b === "Hot"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(["Hot", "Warm", "Cold"] as Bucket[]).map((b) => (
          <div key={b} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {b} ({buckets[b].length})
            </p>
            <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto">
              {buckets[b].map((s) => (
                <LeadCard key={s.lead.lead_id} scored={s} onClick={() => setSelected(s)} />
              ))}
              {buckets[b].length === 0 ? <p className="text-xs text-slate-400">None.</p> : null}
            </div>
          </div>
        ))}
      </div>

      {switching.length > 0 ? (
        <section>
          <SectionHeading
            title="Switching leads"
            description="Already working with another CA and considering a change — different conversation, the objection is transition risk, not price."
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {switching.map((s) => (
              <LeadCard key={s.lead.lead_id} scored={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Stale leads" description="Open, untouched 14+ days, highest value first." />
          <div className="flex flex-col gap-2">
            {stale.map((s) => (
              <LeadCard key={s.lead.lead_id} scored={s} onClick={() => setSelected(s)} />
            ))}
            {stale.length === 0 ? <p className="text-sm text-slate-400">No stale leads right now.</p> : null}
          </div>
        </section>
        <section>
          <SectionHeading
            title="Partial captures"
            description="Chatbot sessions that dropped off — these convert at 0% by email in the firm's data. Callback, not email."
          />
          <div className="flex flex-col gap-2">
            {partial.map((s) => (
              <LeadCard key={s.lead.lead_id} scored={s} onClick={() => setSelected(s)} />
            ))}
            {partial.length === 0 ? <p className="text-sm text-slate-400">No partial captures among open leads.</p> : null}
          </div>
        </section>
      </div>

      {excluded.length > 0 ? (
        <section>
          <SectionHeading title="Excluded from outreach" description="No consent to contact — never call or message these." />
          <ul className="flex flex-wrap gap-2">
            {excluded.map((s) => (
              <li key={s.lead.lead_id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                {s.lead.contact_name} — consent declined
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.lead.contact_name} — ${selected.lead.sub_service_interest}` : ""}
      >
        {selected ? (
          <div className="flex flex-col gap-5 text-sm">
            {selected.isSwitching ? (
              <div className="rounded-md bg-warm-50 p-2.5 text-xs text-warm-800">
                Switching lead — already has a CA, considering a change. Lead with continuity, not price.
              </div>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-900">{selected.lead.status}</dd>
              <dt className="text-slate-500">Enquiry</dt>
              <dd className="text-slate-900">{formatDate(selected.lead.enquiry_date)}</dd>
              <dt className="text-slate-500">Last contact</dt>
              <dd className="text-slate-900">
                {selected.lead.last_contact_date ? formatDate(selected.lead.last_contact_date) : "Never"}
              </dd>
              <dt className="text-slate-500">Estimated value</dt>
              <dd className="text-slate-900">{formatINR(selected.lead.estimated_value_inr)}</dd>
            </dl>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Score: {selected.score}/100 ({selected.bucket})
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {[
                  ["Value", selected.breakdown.value, 25],
                  ["Urgency", selected.breakdown.urgency, 20],
                  ["Stage", selected.breakdown.stage, 20],
                  ["Recency", selected.breakdown.recency, 20],
                  ["Source & capture", selected.breakdown.source, 15],
                ].map(([label, val, max]) => (
                  <div key={label as string} className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 text-slate-500">{label}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-navy-700"
                        style={{ width: `${((val as number) / (max as number)) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-slate-600">
                      {val}/{max}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selected.unfilledFields.length > 0 ? (
              <div className="rounded-md bg-warm-50 p-2.5 text-xs text-warm-800">
                Chatbot session dropped off — fields not captured: {selected.unfilledFields.join(", ")}
              </div>
            ) : null}

            <AiPanel key={selected.lead.lead_id} module="conversion" defaultPrompt={defaultPrompt} />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
