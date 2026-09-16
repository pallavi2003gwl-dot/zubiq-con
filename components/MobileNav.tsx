"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navItems";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
              <p className="text-sm font-semibold text-slate-900">
                <span className="text-navy-600">ZubiQ</span> Consultants
              </p>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <ul className="flex flex-1 flex-col gap-0.5 px-3 py-3">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium ${
                        active
                          ? "bg-gradient-to-r from-navy-700 to-navy-600 text-white shadow-sm shadow-navy-900/25"
                          : "text-slate-600 hover:bg-navy-50"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2 border-t border-slate-200 pt-2">
                <Link
                  href="/about"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm ${
                    pathname === "/about"
                      ? "bg-gradient-to-r from-navy-700 to-navy-600 text-white shadow-sm shadow-navy-900/25"
                      : "text-slate-400 hover:bg-navy-50"
                  }`}
                >
                  <Info size={16} strokeWidth={1.75} />
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
