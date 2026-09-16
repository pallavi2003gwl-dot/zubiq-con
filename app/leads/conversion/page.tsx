import { getCategoryAlignment, getLeads } from "@/lib/queries";
import { scoreLeads } from "@/lib/leadScore";
import { ConversionBoard } from "@/components/ConversionBoard";

export const dynamic = "force-dynamic";

export default async function ConversionPage() {
  const [leads, categoryAlignment] = await Promise.all([getLeads(), getCategoryAlignment()]);
  const scoredLeads = scoreLeads(leads);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Lead Conversion Planner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scored out of 100 on value, urgency, stage, recency, and source. Switching leads and no-consent leads are
          handled separately, never by the raw score.
        </p>
      </div>
      <ConversionBoard scoredLeads={scoredLeads} allLeads={leads} categoryAlignment={categoryAlignment} />
    </div>
  );
}
