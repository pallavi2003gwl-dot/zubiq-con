"use client";

type Option = string | { value: string; label: string };

function normalize(opt: Option): { value: string; label: string } {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-shadow focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-navy-100"
      >
        <option value="">All</option>
        {options.map(normalize).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
