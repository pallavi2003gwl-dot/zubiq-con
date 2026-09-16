// Indian rupee grouping (lakhs/crores), e.g. formatINR(810000) -> "₹8,10,000".
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Not captured";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// DD MMM YYYY, e.g. formatDate("2026-05-21") -> "21 May 2026".
// Formatted manually (not via Intl) in UTC: Postgres `date` columns arrive as
// date-only ISO strings (midnight UTC), and en-GB's ICU data abbreviates
// September as "Sept" rather than "Sep" — this keeps the month strictly 3 letters.
export function formatDate(date: string | null | undefined): string {
  if (!date) return "Not captured";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not captured";
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = MONTHS[parsed.getUTCMonth()];
  const year = parsed.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

// "2026-04" -> "Apr 2026".
export function monthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

// Whole days between a date-only ISO string and now (UTC-safe). Returns null on blank/invalid input.
export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcThen = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  return Math.floor((utcNow - utcThen) / (1000 * 60 * 60 * 24));
}
