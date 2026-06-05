"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBanks } from "@/modules/vendor/hooks/useBanks";

type SelectedBank = { code: string; name: string };

type Props = {
  value: SelectedBank | null;
  onChange: (bank: SelectedBank) => void;
  error?: string;
  size?: "sm" | "md";
};

const SIZES = {
  sm: {
    trigger: "bg-portal-bg px-3 py-2 text-[13.5px] focus:ring-2 focus:ring-portal-accent/30",
    icon: "w-3.5 h-3.5",
    status: "px-3 py-2 text-[13px]",
    search: "px-3 py-1.5 text-[13px]",
    list: "max-h-48",
    item: "px-3 py-2 text-[13px]",
  },
  md: {
    trigger: "bg-white px-4 py-3 text-[15px] focus:ring-1 focus:ring-portal-accent",
    icon: "w-4 h-4",
    status: "px-4 py-3 text-[14px]",
    search: "px-3 py-2 text-[14px]",
    list: "max-h-52",
    item: "px-4 py-2.5 text-[14px]",
  },
} as const;

export default function BankSelector({
  value,
  onChange,
  error,
  size = "md",
}: Props) {
  const { data: banks = [], isLoading, isError, error: queryError } = useBanks();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const s = SIZES[size];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-portal-border text-portal-muted",
          s.status,
        )}
      >
        <Loader2 className={cn(s.icon, "animate-spin")} />
        Loading banks...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          "rounded-lg border border-red-200 bg-red-50 text-red-600",
          s.status,
        )}
      >
        {queryError instanceof Error ? queryError.message : "Failed to load banks."}
      </div>
    );
  }

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-lg border text-left flex items-center justify-between outline-none transition focus:border-portal-accent",
          error ? "border-red-400" : "border-portal-border",
          s.trigger,
        )}
      >
        <span className={value ? "text-portal-text" : "text-portal-muted"}>
          {value ? value.name : "Select your bank"}
        </span>
        <ChevronDown
          className={cn(
            s.icon,
            "text-portal-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-portal-border bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-portal-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search banks..."
              className={cn(
                "w-full rounded-lg border border-portal-border outline-none focus:border-portal-accent bg-portal-bg",
                s.search,
              )}
              autoFocus
            />
          </div>
          <div className={cn("overflow-y-auto", s.list)}>
            {filtered.length === 0 ? (
              <p className="text-[13px] text-portal-muted text-center py-4">
                No banks found
              </p>
            ) : (
              filtered.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    onChange({ code: bank.code, name: bank.name });
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left hover:bg-portal-accent-bg transition-colors",
                    s.item,
                    value?.code === bank.code
                      ? "bg-portal-accent-bg text-portal-accent font-medium"
                      : "text-portal-text",
                  )}
                >
                  {bank.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
