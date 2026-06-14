"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

type Vendor = { id: string; name: string };

const STATUSES = [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
];

export default function AdminBookingsFilters({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.set("page", "0");
    router.push(`${pathname}?${params}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ search: searchRef.current?.value ?? "" });
  }

  const currentSearch = sp.get("search") ?? "";
  const currentVendor = sp.get("vendor") ?? "";
  const currentStatus = sp.get("status") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";

  const hasFilters = currentSearch || currentVendor || currentStatus || dateFrom || dateTo;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-4">
      <form onSubmit={handleSearch} className="relative flex-1 sm:min-w-[260px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          defaultValue={currentSearch}
          placeholder="Search student, phone or reference…"
          className="w-full bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-8 pr-7 py-1.5 focus:outline-none focus:border-portal-accent"
        />
        {currentSearch && (
          <button
            type="button"
            onClick={() => {
              if (searchRef.current) searchRef.current.value = "";
              push({ search: "" });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      <div className="relative">
        <select
          value={currentVendor}
          onChange={(e) => push({ vendor: e.target.value })}
          className="appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={currentStatus}
          onChange={(e) => push({ status: e.target.value })}
          className="appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => push({ dateFrom: e.target.value })}
          className="bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
        />
        <span className="text-[11px] text-portal-muted">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => push({ dateTo: e.target.value })}
          className="bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
        />
      </div>

      {hasFilters && (
        <button
          onClick={() =>
            push({ search: "", vendor: "", status: "", dateFrom: "", dateTo: "" })
          }
          className="text-[12px] text-portal-muted hover:text-portal-text underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
