"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden h-full w-56 shrink-0 flex-col border-r border-slate-200 bg-white py-4 md:flex">
      <ul className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-navy-700 to-navy-600 text-white shadow-sm shadow-navy-900/25"
                    : "text-slate-600 hover:bg-navy-50 hover:text-navy-800"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-200 px-3 pt-3">
        <Link
          href="/about"
          className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
            pathname === "/about"
              ? "bg-gradient-to-r from-navy-700 to-navy-600 text-white shadow-sm shadow-navy-900/25"
              : "text-slate-400 hover:bg-navy-50 hover:text-navy-800"
          }`}
        >
          <Info size={16} strokeWidth={1.75} />
          About
        </Link>
      </div>
    </nav>
  );
}
