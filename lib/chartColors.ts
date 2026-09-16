// Chart colors, kept separate from the CSS theme tokens because Recharts sets
// `fill`/`stroke` as raw SVG attributes, which don't resolve CSS custom properties.
// Categorical slots are assigned by category identity (fixed order), never by
// rank/sort position, so a category keeps its color no matter how a chart sorts it.

export const CATEGORY_COLOR: Record<string, string> = {
  Taxation: "#2a78d6", // slot 1 blue
  GST: "#eb6834", // slot 2 orange
  Bookkeeping: "#1baf7a", // slot 3 aqua
  Incorporation: "#eda100", // slot 4 yellow
  Audit: "#e87ba4", // slot 5 magenta
  "Virtual CFO": "#008300", // slot 6 green
};

export const CATEGORY_ORDER = [
  "Taxation",
  "GST",
  "Bookkeeping",
  "Incorporation",
  "Audit",
  "Virtual CFO",
] as const;

export function categoryColor(category: string): string {
  return CATEGORY_COLOR[category] ?? "#475569";
}

// Sequential blue, light -> dark. Used for the penetration heatmap.
export const SEQUENTIAL_BLUE = [
  "#eef4fc", // near 0%
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b", // near 100%
];

export function sequentialBlueStep(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const idx = Math.min(
    SEQUENTIAL_BLUE.length - 1,
    Math.floor((clamped / 100) * SEQUENTIAL_BLUE.length)
  );
  return SEQUENTIAL_BLUE[idx];
}

// Diverging blue <-> red for alignment_gap (attention_share - revenue_share).
// Positive = over-invested (warm/red), negative = under-served (cool/blue).
export const DIVERGING = {
  negative: "#2a78d6",
  neutral: "#c3c2b7",
  positive: "#e34948",
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export const CHART_INK = {
  primary: "#0f172a",
  secondary: "#475569",
  muted: "#94a3b8",
  grid: "#e2e8f0",
  axis: "#cbd5e1",
};
