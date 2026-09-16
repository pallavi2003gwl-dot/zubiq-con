const TONES = {
  muted: "bg-slate-100 text-slate-500",
  warm: "bg-warm-100 text-warm-800",
  navy: "bg-navy-900/10 text-navy-900",
  critical: "bg-red-50 text-red-700",
} as const;

export function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Renders a value, or a "Not captured" chip when it's blank/null. Ground rule 6. */
export function FieldValue({ value }: { value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") {
    return <Chip tone="muted">Not captured</Chip>;
  }
  return <>{value}</>;
}
