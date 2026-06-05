"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { ChevronDown, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean | string;
  size?: "sm" | "md";
  disabled?: boolean;
  searchable?: boolean;
  loading?: boolean;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
};

const SIZES = {
  sm: {
    trigger: "bg-portal-bg px-3 py-2 text-[13.5px] focus:ring-2 focus:ring-portal-accent/30",
    icon: "w-3.5 h-3.5",
    item: "px-3 py-2 text-[13px]",
    search: "px-3 py-1.5 text-[13px]",
    list: "max-h-48",
  },
  md: {
    trigger: "bg-white px-4 py-3 text-[15px] focus:ring-1 focus:ring-portal-accent",
    icon: "w-4 h-4",
    item: "px-4 py-2.5 text-[14px]",
    search: "px-3 py-2 text-[14px]",
    list: "max-h-60",
  },
} as const;

export default function Select({
  options,
  value = null,
  onChange,
  placeholder = "Select an option",
  error,
  size = "md",
  disabled,
  searchable = false,
  loading = false,
  emptyText = "No results found",
  searchPlaceholder = "Search...",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const s = SIZES[size];

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = React.useMemo(() => {
    if (!searchable || !search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search, searchable]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    const idx = filtered.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => setHighlight(0), [search]);

  React.useEffect(() => {
    optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function commit(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) commit(opt);
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        type="button"
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border text-left flex items-center justify-between gap-2 outline-none transition focus:border-portal-accent disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-400" : "border-portal-border",
          s.trigger,
          className,
        )}
      >
        <span className={cn("truncate", selected ? "text-portal-text" : "text-portal-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            s.icon,
            "text-portal-muted transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="z-50 rounded-xl border border-portal-border bg-white shadow-lg overflow-hidden outline-none"
          onOpenAutoFocus={(e) => {
            if (!searchable) {
              e.preventDefault();
              listRef.current?.focus();
            }
          }}
        >
          {searchable && (
            <div className="p-2 border-b border-portal-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full rounded-lg border border-portal-border outline-none focus:border-portal-accent bg-portal-bg",
                    s.search,
                    "pl-8",
                  )}
                />
              </div>
            </div>
          )}

          <div
            ref={listRef}
            tabIndex={-1}
            onKeyDown={searchable ? undefined : handleKeyDown}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            role="listbox"
            className={cn("overflow-y-auto overscroll-contain outline-none", s.list)}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-portal-muted text-[13px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[13px] text-portal-muted text-center py-4">{emptyText}</p>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={`${option.value}-${i}`}
                  ref={(el) => {
                    optionRefs.current[i] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => commit(option)}
                  className={cn(
                    "w-full text-left flex items-center justify-between gap-2 transition-colors hover:bg-portal-accent-bg disabled:opacity-40 disabled:cursor-not-allowed",
                    s.item,
                    i === highlight && "bg-portal-accent-bg",
                    option.value === value
                      ? "text-portal-accent font-medium"
                      : "text-portal-text",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className={cn(s.icon, "shrink-0 text-portal-accent")} />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
