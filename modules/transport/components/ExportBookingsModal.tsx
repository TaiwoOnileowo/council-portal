"use client";

import Modal from "@/components/ui/Modal";
import Select, { type SelectOption } from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ExportFilters } from "@/modules/transport/transport.types";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Format = "pdf" | "csv";

function getDefaultFilters(): ExportFilters {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    vendorId: undefined,
    direction: "all",
    route: "all",
    bookingDateFrom: fmt(from),
    bookingDateTo: fmt(to),
    departureDateFrom: "",
    departureDateTo: "",
  };
}

const DIRECTION_OPTIONS: SelectOption[] = [
  { value: "all", label: "All directions" },
  { value: "LEAVING", label: "Leaving" },
  { value: "RETURNING", label: "Returning" },
];

export default function ExportBookingsModal({
  open,
  onClose,
  routes,
  vendors,
}: {
  open: boolean;
  onClose: () => void;
  routes: string[];
  vendors?: { id: string; name: string }[];
}) {
  const [filters, setFilters] = useState<ExportFilters>(getDefaultFilters);
  const [exportFormat, setExportFormat] = useState<Format>("pdf");
  const [count, setCount] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedFilters = useDebouncedValue(filters, 400);

  useEffect(() => {
    if (open) {
      setFilters(getDefaultFilters());
      setExportFormat("pdf");
      setCount(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const params = new URLSearchParams({
      ...(debouncedFilters.vendorId ? { vendorId: debouncedFilters.vendorId } : {}),
      direction: debouncedFilters.direction,
      route: debouncedFilters.route,
      bookingDateFrom: debouncedFilters.bookingDateFrom,
      bookingDateTo: debouncedFilters.bookingDateTo,
      departureDateFrom: debouncedFilters.departureDateFrom,
      departureDateTo: debouncedFilters.departureDateTo,
      count: "true",
    });
    fetch(`/api/vendor/export/bookings?${params}`)
      .then((r) => r.json())
      .then((data: { count: number }) => { if (active) setCount(data.count); })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [debouncedFilters, open]);

  const routeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All routes" },
      ...routes.map((r) => ({ value: r, label: r })),
    ],
    [routes],
  );

  const vendorOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "All vendors" },
      ...(vendors ?? []).map((v) => ({ value: v.id, label: v.name })),
    ],
    [vendors],
  );

  function handleClose() {
    if (isExporting) return;
    onClose();
  }

  function set<K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
        direction: filters.direction,
        route: filters.route,
        bookingDateFrom: filters.bookingDateFrom,
        bookingDateTo: filters.bookingDateTo,
        departureDateFrom: filters.departureDateFrom,
        departureDateTo: filters.departureDateTo,
        format: exportFormat,
      });

      const res = await fetch(`/api/vendor/export/bookings?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFormat === "pdf" ? "bookings.pdf" : "bookings.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  const canExport = !isExporting && count !== null && count > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Export Bookings"
      description="Choose filters and format to download your booking data"
    >
      <div className="p-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
            Format
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                {
                  f: "pdf" as Format,
                  Icon: FileText,
                  label: "PDF",
                },
                {
                  f: "csv" as Format,
                  Icon: FileSpreadsheet,
                  label: "CSV / Spreadsheet",
                },
              ] as const
            ).map(({ f, Icon, label }) => {
              const active = exportFormat === f;
              return (
                <button
                  key={f}
                  onClick={() => setExportFormat(f)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-portal-accent bg-portal-accent-bg"
                      : "border-portal-border bg-portal-surface hover:border-portal-accent/40"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? "text-portal-accent" : "text-portal-muted"}`}
                  />
                  <div>
                    <p
                      className={`text-[12px] font-semibold ${active ? "text-portal-accent" : "text-portal-text"}`}
                    >
                      {label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Filters
          </p>

          {vendors && (
            <div>
              <label className="text-[11px] text-portal-muted mb-1 block">
                Vendor
              </label>
              <Select
                size="sm"
                options={vendorOptions}
                value={filters.vendorId ?? ""}
                onChange={(v) => set("vendorId", v || undefined)}
                searchable={vendorOptions.length > 6}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-portal-muted mb-1 block">
                Direction
              </label>
              <Select
                size="sm"
                options={DIRECTION_OPTIONS}
                value={filters.direction}
                onChange={(v) =>
                  set("direction", v as ExportFilters["direction"])
                }
              />
            </div>
            <div>
              <label className="text-[11px] text-portal-muted mb-1 block">
                Route
              </label>
              <Select
                size="sm"
                options={routeOptions}
                value={filters.route}
                onChange={(v) => set("route", v)}
                searchable={routeOptions.length > 5}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-portal-muted mb-1 block">
              Booking date range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.bookingDateFrom}
                onChange={(e) => set("bookingDateFrom", e.target.value)}
                className="flex-1 bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-2 focus:outline-none focus:border-portal-accent"
              />
              <span className="text-[11px] text-portal-muted flex-shrink-0">
                to
              </span>
              <input
                type="date"
                value={filters.bookingDateTo}
                onChange={(e) => set("bookingDateTo", e.target.value)}
                className="flex-1 bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-2 focus:outline-none focus:border-portal-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-portal-muted mb-1 block">
              Departure date range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.departureDateFrom}
                onChange={(e) => set("departureDateFrom", e.target.value)}
                className="flex-1 bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-2 focus:outline-none focus:border-portal-accent"
              />
              <span className="text-[11px] text-portal-muted flex-shrink-0">
                to
              </span>
              <input
                type="date"
                value={filters.departureDateTo}
                onChange={(e) => set("departureDateTo", e.target.value)}
                className="flex-1 bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-2 focus:outline-none focus:border-portal-accent"
              />
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-portal-border space-y-3">
          <p className="text-[12px] text-portal-muted">
            {count === null ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Counting…
              </span>
            ) : count === 0 ? (
              <span className="text-red-400">
                No bookings match your filters
              </span>
            ) : (
              <>
                <span className="font-semibold text-portal-text">{count}</span>{" "}
                booking{count !== 1 ? "s" : ""} will be exported
              </>
            )}
          </p>

          <button
            onClick={handleExport}
            disabled={!canExport}
            className="w-full flex items-center justify-center gap-2 py-3 bg-portal-accent hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-semibold transition-all hover:enabled:-translate-y-0.5"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting
              ? "Exporting…"
              : `Download ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
