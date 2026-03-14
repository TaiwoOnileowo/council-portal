"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Calendar,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { vendorRoutes, type Route } from "./vendorDashboardData";

function toTitleCase(str: string) {
  return str
    .trim()
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
}

const EMPTY_FORM = {
  from: "",
  to: "",
  goingPrice: "",
  returnPrice: "",
  capacityType: "number" as "number" | "unlimited",
  capacityValue: "",
  active: true,
  hasUnavailability: false,
  unavailStart: "",
  unavailEnd: "",
};

type FormState = typeof EMPTY_FORM;

function formFromRoute(r: Route): FormState {
  return {
    from: r.from,
    to: r.to,
    goingPrice: String(r.goingPrice),
    returnPrice: String(r.returnPrice),
    capacityType: r.capacity === "unlimited" ? "unlimited" : "number",
    capacityValue: r.capacity === "unlimited" ? "" : String(r.capacity),
    active: r.active,
    hasUnavailability: !!r.unavailability,
    unavailStart: r.unavailability?.startDate ?? "",
    unavailEnd: r.unavailability?.endDate ?? "",
  };
}

function formToRoute(id: string, f: FormState): Route {
  return {
    id,
    from: toTitleCase(f.from),
    to: toTitleCase(f.to),
    goingPrice: parseInt(f.goingPrice, 10),
    returnPrice: parseInt(f.returnPrice, 10),
    capacity:
      f.capacityType === "unlimited"
        ? "unlimited"
        : parseInt(f.capacityValue, 10),
    active: f.active,
    unavailability:
      f.hasUnavailability && f.unavailStart && f.unavailEnd
        ? { startDate: f.unavailStart, endDate: f.unavailEnd }
        : undefined,
  };
}

function isValid(f: FormState) {
  if (!f.from.trim() || !f.to.trim()) return false;
  const g = parseInt(f.goingPrice, 10);
  const r = parseInt(f.returnPrice, 10);
  if (isNaN(g) || g <= 0 || isNaN(r) || r <= 0) return false;
  if (f.capacityType === "number") {
    const c = parseInt(f.capacityValue, 10);
    if (isNaN(c) || c <= 0) return false;
  }
  if (f.hasUnavailability && (!f.unavailStart || !f.unavailEnd)) return false;
  return true;
}

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
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-portal-accent" : "bg-portal-border"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>(vendorRoutes);
  const [modal, setModal] = useState<
    { mode: "add" } | { mode: "edit"; id: string } | null
  >(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  }

  function openEdit(route: Route) {
    setForm(formFromRoute(route));
    setModal({ mode: "edit", id: route.id });
  }

  function save() {
    if (!modal || !isValid(form)) return;
    if (modal.mode === "add") {
      setRoutes((p) => [...p, formToRoute(`RT-${Date.now()}`, form)]);
    } else {
      setRoutes((p) =>
        p.map((r) => (r.id === modal.id ? formToRoute(modal.id, form) : r))
      );
    }
    setModal(null);
  }

  function toggleActive(id: string) {
    setRoutes((p) =>
      p.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Routes & Pricing</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add route
        </button>
      </div>

      {/* Table */}
      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_48px_64px] gap-3 px-5 py-3 bg-portal-bg border-b border-portal-border">
          {["Route", "Going", "Return", "Capacity", "Active", ""].map((h) => (
            <span
              key={h}
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Route rows */}
        <AnimatePresence mode="popLayout">
          {routes.map((route) => (
            <motion.div
              key={route.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr_48px_64px] gap-3 px-5 py-3.5 items-center border-b border-portal-border last:border-b-0 text-[13px] transition-opacity ${
                !route.active ? "opacity-50" : ""
              }`}
            >
              {/* Route */}
              <div className="flex items-center gap-2 font-semibold text-portal-text min-w-0">
                <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                <span className="truncate">
                  {route.from}
                  <ArrowRight className="w-3 h-3 inline mx-1 text-portal-muted" />
                  {route.to}
                </span>
                {route.unavailability && (
                  <span title="Scheduled unavailability set">
                    <Calendar className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  </span>
                )}
              </div>

              {/* Going price */}
              <span className="font-bold text-portal-text">
                ₦{route.goingPrice.toLocaleString()}
              </span>

              {/* Return price */}
              <span className="font-bold text-portal-text">
                ₦{route.returnPrice.toLocaleString()}
              </span>

              {/* Capacity */}
              <span className="text-portal-muted">
                {route.capacity === "unlimited" ? (
                  <span className="text-portal-text font-medium">∞</span>
                ) : (
                  <span className="flex items-center gap-1 text-portal-text">
                    <Users className="w-3 h-3 text-portal-muted" />
                    {route.capacity}
                  </span>
                )}
              </span>

              {/* Active toggle */}
              <button
                type="button"
                onClick={() => toggleActive(route.id)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  route.active ? "bg-portal-accent" : "bg-portal-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    route.active ? "translate-x-4" : ""
                  }`}
                />
              </button>

              {/* Actions */}
              {deleteId === route.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setRoutes((p) => p.filter((r) => r.id !== route.id));
                      setDeleteId(null);
                    }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(route)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(route.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {routes.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-portal-muted">
            <MapPin className="w-8 h-8 opacity-30" />
            <p className="text-[13px]">No routes yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-portal-surface rounded-2xl shadow-xl border border-portal-border p-6"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-[16px] font-bold">
                  {modal.mode === "add" ? "Add Route" : "Edit Route"}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Locations */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      From
                    </label>
                    <input
                      type="text"
                      value={form.from}
                      onChange={(e) => set("from", e.target.value)}
                      placeholder="e.g. University Gate"
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      To
                    </label>
                    <input
                      type="text"
                      value={form.to}
                      onChange={(e) => set("to", e.target.value)}
                      placeholder="e.g. Yaba"
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      Going Price (₦)
                    </label>
                    <input
                      type="number"
                      value={form.goingPrice}
                      onChange={(e) => set("goingPrice", e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                      Return Price (₦)
                    </label>
                    <input
                      type="number"
                      value={form.returnPrice}
                      onChange={(e) => set("returnPrice", e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                    Capacity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("capacityType", "number")}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                        form.capacityType === "number"
                          ? "border-portal-accent text-portal-accent bg-portal-accent/5"
                          : "border-portal-border text-portal-muted hover:border-portal-text"
                      }`}
                    >
                      Number
                    </button>
                    <button
                      type="button"
                      onClick={() => set("capacityType", "unlimited")}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                        form.capacityType === "unlimited"
                          ? "border-portal-accent text-portal-accent bg-portal-accent/5"
                          : "border-portal-border text-portal-muted hover:border-portal-text"
                      }`}
                    >
                      Unlimited
                    </button>
                    <AnimatePresence>
                      {form.capacityType === "number" && (
                        <motion.input
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          type="number"
                          value={form.capacityValue}
                          onChange={(e) => set("capacityValue", e.target.value)}
                          placeholder="Max passengers"
                          min="1"
                          className="flex-1 min-w-0 px-3 py-1.5 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-portal-text">
                      Active
                    </p>
                    <p className="text-[11px] text-portal-muted">
                      Visible to students on the booking screen
                    </p>
                  </div>
                  <Toggle on={form.active} onChange={(v) => set("active", v)} />
                </div>

                {/* Scheduled unavailability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[13px] font-medium text-portal-text">
                        Scheduled Unavailability
                      </p>
                      <p className="text-[11px] text-portal-muted">
                        Optional — auto-pauses route during this period
                      </p>
                    </div>
                    <Toggle
                      on={form.hasUnavailability}
                      onChange={(v) => set("hasUnavailability", v)}
                    />
                  </div>
                  <AnimatePresence>
                    {form.hasUnavailability && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-3 overflow-hidden"
                      >
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={form.unavailStart}
                            onChange={(e) =>
                              set("unavailStart", e.target.value)
                            }
                            className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={form.unavailEnd}
                            onChange={(e) => set("unavailEnd", e.target.value)}
                            className="w-full px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 mt-6 pt-5 border-t border-portal-border">
                <button
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-[13px] font-medium text-portal-muted hover:text-portal-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={!isValid(form)}
                  className="px-4 py-2 text-[13px] font-medium bg-portal-accent text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-portal-accent2 transition-colors"
                >
                  {modal.mode === "add" ? "Add Route" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
