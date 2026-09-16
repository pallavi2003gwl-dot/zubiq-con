import { getClients, getEngagements, getSubServices } from "@/lib/queries";
import { ClientsTable } from "@/components/ClientsTable";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, engagements, subServices] = await Promise.all([
    getClients(),
    getEngagements(),
    getSubServices(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Clients</h1>
        <p className="mt-1 text-sm text-slate-500">
          The missing sub-service filter turns this table into a prospecting list.
        </p>
      </div>
      <ClientsTable clients={clients} engagements={engagements} subServices={subServices} />
    </div>
  );
}
