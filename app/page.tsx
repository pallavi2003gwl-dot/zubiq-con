import { getCategoryAlignment, getClients, getEngagements, getLeads, getSubServiceAlignment } from "@/lib/queries";

// Always fetch live from Supabase — never freeze this dashboard as a build-time snapshot.
export const dynamic = "force-dynamic";
import { averageServicePenetration } from "@/lib/serviceMix";
import { formatINR } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { SectionHeading } from "@/components/SectionHeading";
import { RevenueByCategoryBar } from "@/components/charts/RevenueByCategoryBar";
import { CategoryCountBar } from "@/components/charts/CategoryCountBar";
import { PenetrationHeatmap } from "@/components/charts/PenetrationHeatmap";
import { LeadFunnel } from "@/components/charts/LeadFunnel";
import { CategoryConversionTable } from "@/components/CategoryConversionTable";

const TURNOVER_ORDER = ["Under 50L", "50L - 2Cr", "2Cr - 10Cr", "10Cr+", "NA (Individual)"];

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export default async function OverviewPage() {
  const [clients, engagements, leads, categoryAlignment, subServiceAlignment] = await Promise.all([
    getClients(),
    getEngagements(),
    getLeads(),
    getCategoryAlignment(),
    getSubServiceAlignment(),
  ]);

  const activeClients = clients.filter((c) => c.status === "Active");
  const totalRecurringFee = engagements
    .filter((e) => e.status === "Active" && e.billing_frequency === "Annual")
    .reduce((sum, e) => sum + e.annual_fee_inr, 0);
  const openLeads = leads.filter((l) => l.status !== "Converted" && l.status !== "Lost");
  const { avgSubServices, avgCategories } = averageServicePenetration(clients, engagements);

  const byIndustry = countBy(activeClients, (c) => c.industry);
  const industryData = Object.entries(byIndustry).map(([label, value]) => ({ label, value }));

  const byTurnover = countBy(activeClients, (c) => c.annual_turnover_band);
  const turnoverData = TURNOVER_ORDER.filter((band) => byTurnover[band]).map((band) => ({
    label: band,
    value: byTurnover[band],
  }));

  const leadStatusCounts = countBy(leads, (l) => l.status);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Client, lead, and service-mix segmentation across ZubiQ&apos;s Delhi-NCR book.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active clients" value={String(activeClients.length)} subvalue={`${clients.length} total`} />
        <KpiCard label="Total annual recurring fee value" value={formatINR(totalRecurringFee)} />
        <KpiCard label="Open leads" value={String(openLeads.length)} subvalue={`${leads.length} total leads`} />
        <KpiCard
          label="Service penetration"
          value={`${avgSubServices.toFixed(1)} of 30 sub-services`}
          subvalue={`vs ${avgCategories.toFixed(1)} of 6 categories — the gap is the opportunity`}
          highlight
        />
      </div>

      <section>
        <SectionHeading title="Revenue by category" description="Active annual fees, sorted descending." />
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
          <RevenueByCategoryBar data={categoryAlignment} />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Sub-service penetration heatmap"
          description="Share of active clients holding each of the 30 sub-services. Statutory services are ringed — a low number there is a compliance gap, not just an upsell."
        />
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
          <PenetrationHeatmap rows={subServiceAlignment} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Clients by industry" />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <CategoryCountBar data={industryData} sortByValue height={300} />
          </div>
        </section>
        <section>
          <SectionHeading title="Clients by turnover band" />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <CategoryCountBar data={turnoverData} sortByValue={false} height={300} />
          </div>
        </section>
      </div>

      <section>
        <SectionHeading title="Lead funnel" description="Counts by status, and conversion rate per category." />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <LeadFunnel counts={leadStatusCounts} />
          </div>
          <CategoryConversionTable rows={categoryAlignment} />
        </div>
      </section>
    </div>
  );
}
