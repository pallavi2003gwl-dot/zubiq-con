import { MobileNav } from "@/components/MobileNav";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <div>
          <p className="text-sm font-semibold tracking-tight text-slate-900">
            <span className="text-navy-600">ZubiQ</span> Consultants
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">AI Marketing Recommendation Engine — Pilot</p>
        </div>
      </div>
      <div className="text-right">
        <p className="hidden text-xs text-slate-400 sm:block">Data period</p>
        <p className="text-xs font-medium text-slate-600">01 Apr 2026 – 15 Sep 2026</p>
      </div>
    </header>
  );
}
