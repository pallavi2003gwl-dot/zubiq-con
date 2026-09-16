"use client";

import { DataTable, type Column } from "@/components/DataTable";
import type { CategoryAlignmentRow } from "@/lib/types";

const columns: Column<CategoryAlignmentRow>[] = [
  { key: "category", header: "Category", accessor: (r) => r.service_category },
  {
    key: "leads",
    header: "Leads",
    accessor: (r) => r.leads,
    sortValue: (r) => r.leads,
    align: "right",
  },
  {
    key: "conv",
    header: "Conversion rate",
    accessor: (r) => `${r.conversion_rate_pct}%`,
    sortValue: (r) => r.conversion_rate_pct,
    align: "right",
  },
];

export function CategoryConversionTable({ rows }: { rows: CategoryAlignmentRow[] }) {
  return <DataTable rows={rows} rowKey={(r) => r.service_id} columns={columns} />;
}
