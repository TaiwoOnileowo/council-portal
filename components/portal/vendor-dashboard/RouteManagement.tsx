"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  vendorPriceLists,
  type PriceList,
  type PriceListAvailability,
  type PriceListRoute,
  type DepartureTime,
} from "./vendorDashboardData";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// --- Draft types for the drawer form ---

type DraftRoute = {
  id: string;
  name: string;
  price: string;
  capacityType: "number" | "unlimited";
  capacityValue: string;
  active: boolean;
};

type DrawerForm = {
  name: string;
  direction: "leaving" | "returning";
  routes: DraftRoute[];
  departureTimes: DepartureTime[];
  luggagePolicy: string;
  notes: string;
  availType: "active" | "inactive" | "scheduled";
  schedStart: string;
  schedEnd: string;
};

// --- Conversion helpers ---

function draftFromRoute(r: PriceListRoute): DraftRoute {
  return {
    id: r.id,
    name: r.name,
    price: String(r.price),
    capacityType: r.capacity === "unlimited" ? "unlimited" : "number",
    capacityValue: r.capacity === "unlimited" ? "" : String(r.capacity),
    active: r.active,
  };
}

function routeFromDraft(d: DraftRoute): PriceListRoute {
  return {
    id: d.id,
    name: d.name.trim(),
    price: parseInt(d.price, 10) || 0,
    capacity:
      d.capacityType === "unlimited"
        ? "unlimited"
        : Math.max(1, parseInt(d.capacityValue, 10) || 1),
    active: d.active,
  };
}

function formFromPriceList(pl: PriceList): DrawerForm {
  return {
    name: pl.name,
    direction: pl.direction,
    routes: pl.routes.map(draftFromRoute),
    departureTimes: pl.departureTimes,
    luggagePolicy: pl.luggagePolicy,
    notes: pl.notes,
    availType: pl.availability.type,
    schedStart:
      pl.availability.type === "scheduled" ? pl.availability.startDate : "",
    schedEnd:
      pl.availability.type === "scheduled" ? pl.availability.endDate : "",
  };
}

function priceListFromForm(id: string, form: DrawerForm): PriceList {
  const availability: PriceListAvailability =
    form.availType === "scheduled"
      ? { type: "scheduled", startDate: form.schedStart, endDate: form.schedEnd }
      : form.availType === "active"
      ? { type: "active" }
      : { type: "inactive" };
  return {
    id,
    name: form.name.trim(),
    direction: form.direction,
    routes: form.routes.map(routeFromDraft),
    departureTimes: form.departureTimes,
    luggagePolicy: form.luggagePolicy,
    notes: form.notes,
    availability,
  };
}

function emptyForm(direction: "leaving" | "returning"): DrawerForm {
  return {
    name: "",
    direction,
    routes: [],
    departureTimes: [],
    luggagePolicy: "",
    notes: "",
    availType: "active",
    schedStart: "",
    schedEnd: "",
  };
}

function newDraftRoute(): DraftRoute {
  return {
    id: `DR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    price: "",
    capacityType: "number",
    capacityValue: "",
    active: true,
  };
}

// --- Small reusable pieces ---

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-portal-accent" : "bg-portal-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

function StatusPill({ availability }: { availability: PriceListAvailability }) {
  if (availability.type === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-portal-green-bg text-portal-green whitespace-nowrap flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-portal-green" />
        Active
      </span>
    );
  }
  if (availability.type === "inactive") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-portal-bg text-portal-muted whitespace-nowrap flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-portal-muted" />
        Inactive
      </span>
    );
  }
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {fmt(availability.startDate)} – {fmt(availability.endDate)}
    </span>
  );
}

function PriceListCard({
  pl,
  onEdit,
}: {
  pl: PriceList;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="text-left w-full bg-portal-surface border border-portal-border rounded-xl p-4 hover:border-portal-accent/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[14px] font-semibold text-portal-text group-hover:text-portal-accent transition-colors leading-snug">
          {pl.name}
        </p>
        <StatusPill availability={pl.availability} />
      </div>
      <p className="text-[12px] text-portal-muted">
        {pl.routes.length} route{pl.routes.length !== 1 ? "s" : ""}
      </p>
    </button>
  );
}

function EmptyCard({ onNew }: { onNew: () => void }) {
  return (
    <button
      onClick={onNew}
      className="text-left w-full border border-dashed border-portal-border rounded-xl p-4 hover:border-portal-accent/50 transition-colors"
    >
      <p className="text-[13px] text-portal-muted">No price lists yet.</p>
      <p className="text-[12px] text-portal-accent mt-0.5">+ Create one</p>
    </button>
  );
}

// --- Main component ---

export default function RouteManagement() {
  const [priceLists, setPriceLists] = useState<PriceList[]>(vendorPriceLists);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DrawerForm>(emptyForm("leaving"));

  const leaving = priceLists.filter((p) => p.direction === "leaving");
  const returning = priceLists.filter((p) => p.direction === "returning");

  function openNew(direction: "leaving" | "returning") {
    setEditingId(null);
    setForm(emptyForm(direction));
    setDrawerOpen(true);
  }

  function openEdit(pl: PriceList) {
    setEditingId(pl.id);
    setForm(formFromPriceList(pl));
    setDrawerOpen(true);
  }

  function setF<K extends keyof DrawerForm>(key: K, value: DrawerForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function setRoute(id: string, patch: Partial<DraftRoute>) {
    setForm((p) => ({
      ...p,
      routes: p.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function addRoute() {
    setForm((p) => ({ ...p, routes: [...p.routes, newDraftRoute()] }));
  }

  function removeRoute(id: string) {
    setForm((p) => ({ ...p, routes: p.routes.filter((r) => r.id !== id) }));
  }

  function addDeparture() {
    const entry: DepartureTime = {
      id: `DT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      day: "Monday",
      time: "08:00",
    };
    setForm((p) => ({ ...p, departureTimes: [...p.departureTimes, entry] }));
  }

  function setDeparture(id: string, patch: Partial<DepartureTime>) {
    setForm((p) => ({
      ...p,
      departureTimes: p.departureTimes.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    }));
  }

  function removeDeparture(id: string) {
    setForm((p) => ({
      ...p,
      departureTimes: p.departureTimes.filter((d) => d.id !== id),
    }));
  }

  function save() {
    if (!canSave) return;
    if (editingId) {
      setPriceLists((p) =>
        p.map((pl) =>
          pl.id === editingId ? priceListFromForm(editingId, form) : pl
        )
      );
    } else {
      setPriceLists((p) => [...p, priceListFromForm(`PL-${Date.now()}`, form)]);
    }
    setDrawerOpen(false);
  }

  const canSave =
    form.name.trim().length > 0 &&
    (form.availType !== "scheduled" ||
      (!!form.schedStart && !!form.schedEnd));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-5">
          Routes & Pricing
        </h2>

        {/* Leaving School */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-portal-text">
              🚀 Leaving School
            </h3>
            <button
              onClick={() => openNew("leaving")}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Price List
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leaving.map((pl) => (
              <PriceListCard key={pl.id} pl={pl} onEdit={() => openEdit(pl)} />
            ))}
            {leaving.length === 0 && (
              <EmptyCard onNew={() => openNew("leaving")} />
            )}
          </div>
        </div>

        {/* Returning to School */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-portal-text">
              🏠 Returning to School
            </h3>
            <button
              onClick={() => openNew("returning")}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Price List
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {returning.map((pl) => (
              <PriceListCard key={pl.id} pl={pl} onEdit={() => openEdit(pl)} />
            ))}
            {returning.length === 0 && (
              <EmptyCard onNew={() => openNew("returning")} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="bg-portal-surface sm:max-w-[480px] flex flex-col overflow-hidden p-0">
          {/* Header — name as editable heading */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-portal-border flex-shrink-0">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setF("name", e.target.value)}
              placeholder={
                form.direction === "leaving"
                  ? "e.g. Mar 2026 Resumption"
                  : "e.g. Weekend Express"
              }
              className="font-heading text-[17px] font-bold bg-transparent focus:outline-none placeholder:text-portal-muted/40 flex-1 min-w-0 text-portal-text"
            />
            <DrawerClose asChild>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {/* Routes table */}
            <div className="border-b border-portal-border">
              {/* Table column headers */}
              <div className="grid grid-cols-[1fr_88px_100px_36px_32px] gap-2 px-5 py-2.5 bg-portal-bg border-b border-portal-border">
                {["Route", "Price (₦)", "Capacity", "", ""].map((h, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Route rows */}
              {form.routes.map((route) => (
                <div
                  key={route.id}
                  className="grid grid-cols-[1fr_88px_100px_36px_32px] gap-2 px-5 py-2.5 items-center border-b border-portal-border last:border-b-0"
                >
                  {/* Name */}
                  <input
                    type="text"
                    value={route.name}
                    onChange={(e) =>
                      setRoute(route.id, { name: e.target.value })
                    }
                    placeholder="Route name"
                    className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                  />

                  {/* Price */}
                  <input
                    type="number"
                    value={route.price}
                    onChange={(e) =>
                      setRoute(route.id, { price: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                  />

                  {/* Capacity */}
                  <div className="flex items-center gap-1">
                    {route.capacityType === "number" && (
                      <input
                        type="number"
                        value={route.capacityValue}
                        onChange={(e) =>
                          setRoute(route.id, { capacityValue: e.target.value })
                        }
                        placeholder="Max"
                        min="1"
                        className="w-12 px-1.5 py-1.5 text-[12px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setRoute(route.id, {
                          capacityType:
                            route.capacityType === "unlimited"
                              ? "number"
                              : "unlimited",
                        })
                      }
                      title={
                        route.capacityType === "unlimited"
                          ? "Switch to limited"
                          : "Set unlimited"
                      }
                      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md border text-[13px] font-semibold transition-colors ${
                        route.capacityType === "unlimited"
                          ? "border-portal-accent bg-portal-accent/5 text-portal-accent"
                          : "border-portal-border text-portal-muted hover:border-portal-text"
                      }`}
                    >
                      ∞
                    </button>
                  </div>

                  {/* Active toggle */}
                  <Toggle
                    on={route.active}
                    onChange={(v) => setRoute(route.id, { active: v })}
                  />

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeRoute(route.id)}
                    className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add route */}
              <button
                type="button"
                onClick={addRoute}
                className="w-full flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium text-portal-accent hover:bg-portal-accent-bg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Route
              </button>
            </div>

            {/* Departure Times */}
            <div className="border-b border-portal-border">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-3">
                  Departure Times
                </p>
                <div className="space-y-2">
                  {form.departureTimes.map((dt) => (
                    <div key={dt.id} className="flex items-center gap-2">
                      <select
                        value={dt.day}
                        onChange={(e) =>
                          setDeparture(dt.id, { day: e.target.value })
                        }
                        className="flex-1 px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={dt.time}
                        onChange={(e) =>
                          setDeparture(dt.id, { time: e.target.value })
                        }
                        className="w-28 px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeparture(dt.id)}
                        className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addDeparture}
                  className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Departure
                </button>
              </div>
            </div>

            {/* Luggage Policy & Notes */}
            <div className="border-b border-portal-border px-5 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                  Luggage Policy
                </label>
                <textarea
                  value={form.luggagePolicy}
                  onChange={(e) => setF("luggagePolicy", e.target.value)}
                  placeholder="e.g. 1 big bag + 1 hand luggage. Extra bags attract additional charge."
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                  Notes{" "}
                  <span className="normal-case font-normal text-portal-muted/60">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                  placeholder="e.g. No food items. Contact driver 30 mins before departure."
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent resize-none"
                />
              </div>
            </div>

            {/* Availability section */}
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-3">
                Availability
              </p>

              <div className="flex gap-2 mb-4">
                {(
                  [
                    { value: "active", label: "Active now" },
                    { value: "inactive", label: "Inactive" },
                    { value: "scheduled", label: "Scheduled" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setF("availType", value)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                      form.availType === value
                        ? "border-portal-accent text-portal-accent bg-portal-accent/5"
                        : "border-portal-border text-portal-muted hover:border-portal-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.availType === "scheduled" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.schedStart}
                      onChange={(e) => setF("schedStart", e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.schedEnd}
                      onChange={(e) => setF("schedEnd", e.target.value)}
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-portal-border flex-shrink-0">
            <button
              onClick={save}
              disabled={!canSave}
              className="w-full py-2.5 text-[14px] font-semibold bg-portal-accent text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-portal-accent2 transition-colors"
            >
              {editingId ? "Save Changes" : "Create Price List"}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
