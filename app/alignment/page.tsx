import {
  getCategoryAlignment,
  getClients,
  getEngagements,
  getLeads,
  getSocialPosts,
  getSubServiceAlignment,
} from "@/lib/queries";
import { classifyCategoryAlignment, classifySubServiceAlignment } from "@/lib/alignment";
import { averageServicePenetration } from "@/lib/serviceMix";
import { buildAlignmentDataContext } from "@/lib/alignmentContext";
import { SectionHeading } from "@/components/SectionHeading";
import { AttentionRevenueBar } from "@/components/charts/AttentionRevenueBar";
import { EngagementLeadsScatter } from "@/components/charts/EngagementLeadsScatter";
import { AlignmentTable } from "@/components/AlignmentTable";
import { MonthlyTrendSection } from "@/components/MonthlyTrendSection";
import { AiPanel } from "@/components/AiPanel";

export const dynamic = "force-dynamic";

const WINDOW_START = "2026-04-01";
const WINDOW_END = "2026-09-15";

export default async function AlignmentPage() {
  const [categoryRows, subServiceRows, posts, leads, clients, engagements] = await Promise.all([
    getCategoryAlignment(),
    getSubServiceAlignment(),
    getSocialPosts(),
    getLeads(),
    getClients(),
    getEngagements(),
  ]);

  const categories = classifyCategoryAlignment(categoryRows);
  const subServices = classifySubServiceAlignment(subServiceRows);
  const { avgSubServices } = averageServicePenetration(clients, engagements);

  const subServicesByCategory = new Map<string, typeof subServices>();
  for (const s of subServices) {
    const list = subServicesByCategory.get(s.service_category) ?? [];
    list.push(s);
    subServicesByCategory.set(s.service_category, list);
  }

  const dataContext = buildAlignmentDataContext(
    categories,
    subServices,
    posts,
    avgSubServices,
    WINDOW_START,
    WINDOW_END
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-navy-900 via-navy-700 to-navy-600 bg-clip-text text-transparent">Social vs Sales Alignment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Where social effort goes, versus where the money and the leads actually are.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Attention vs revenue" description="Share of reach vs share of active revenue, per category." />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <AttentionRevenueBar data={categories} />
          </div>
        </section>
        <section>
          <SectionHeading
            title="Engagement rate vs lead volume"
            description="High engagement, low lead volume is audience that responds but is never asked to act."
          />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <EngagementLeadsScatter data={categories} />
          </div>
        </section>
      </div>

      <section>
        <SectionHeading
          title="Alignment table"
          description="Click a category to drill into its 5 sub-services — this is what turns a category insight into a specific content decision."
        />
        <AlignmentTable categories={categories} subServicesByCategory={subServicesByCategory} />
      </section>

      <MonthlyTrendSection posts={posts} leads={leads} />

      <section>
        <SectionHeading title="Generate social & ad strategy" />
        <AiPanel module="alignment" dataContext={dataContext} />
      </section>
    </div>
  );
}
