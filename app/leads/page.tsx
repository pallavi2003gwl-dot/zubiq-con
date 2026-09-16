import { getLeads } from "@/lib/queries";
import { LeadsTable } from "@/components/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Partial chatbot sessions and untouched-14-day leads are flagged, never left blank.
        </p>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
}
