import { getClients, getEngagements, getSubServiceAlignment, getSubServices } from "@/lib/queries";
import { computeUpsellOpportunities } from "@/lib/upsell";
import { averageServicePenetration } from "@/lib/serviceMix";

export const dynamic = "force-dynamic";
import { UpsellTable } from "@/components/UpsellTable";

export default async function UpsellPage() {
  const [clients, engagements, subServices, subServiceAlignment] = await Promise.all([
    getClients(),
    getEngagements(),
    getSubServices(),
    getSubServiceAlignment(),
  ]);

  const { opportunities, flags } = computeUpsellOpportunities(clients, engagements, subServices);
  const { avgSubServices } = averageServicePenetration(clients, engagements);

  const sorted = [...opportunities].sort((a, b) => b.indicativeAnnualFeeInr - a.indicativeAnnualFeeInr);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Upsell / Cross-sell</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gaps checked against the 30-service catalogue, not the 6 categories. Statutory gaps are compliance
          exposures, not sales pitches.
        </p>
      </div>
      <UpsellTable
        opportunities={sorted}
        flags={flags}
        clients={clients}
        engagements={engagements}
        subServiceAlignment={subServiceAlignment}
        avgSubServices={avgSubServices}
      />
    </div>
  );
}
