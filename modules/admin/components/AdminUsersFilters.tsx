"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

const LEVELS = ["100", "200", "300", "400", "500"];

export default function AdminUsersFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.set("page", "0");
    router.push(`/admin/users?${params}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ search: searchRef.current?.value ?? "" });
  }

  const currentSearch = sp.get("search") ?? "";
  const currentLevel = sp.get("level") ?? "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          defaultValue={currentSearch}
          placeholder="Search name, email or matric…"
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
          value={currentLevel}
          onChange={(e) => push({ level: e.target.value })}
          className="appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
      </div>
    </div>
  );
}
