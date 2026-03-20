"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import {
  CalendarIcon,
  House,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type PriceList,
  type PriceListAvailability,
  type PriceListRoute,
} from "./vendorDashboardData";
import {
  useVendorPriceLists,
  useCreatePriceList,
  useUpdatePriceList,
} from "@/lib/hooks/useVendorPriceLists";
import type { PriceListBody } from "@/lib/validations/vendor";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// --- Formatting helpers ---

function formatWithCommas(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

function parseAmount(value: string) {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

// --- RHF form type ---

type DrawerFormValues = {
  name: string;
  direction: "leaving" | "returning";
  routes: Array<{
    name: string;
    price: string; // formatted with commas
    capacityType: "number" | "unlimited";
    capacityValue: string;
    active: boolean;
  }>;
  departureTimes: Array<{
    day: string;
    time: string;
  }>;
  luggagePolicy: string;
  notes: string;
  availType: "active" | "inactive" | "scheduled";
  schedStart: string;
  schedEnd: string;
};

// --- Conversion helpers ---

function draftFromRoute(r: PriceListRoute) {
  return {
    name: r.name,
    price: r.price > 0 ? r.price.toLocaleString("en-NG") : "",
    capacityType: (r.capacity === "unlimited" ? "unlimited" : "number") as
      | "number"
      | "unlimited",
    capacityValue: r.capacity === "unlimited" ? "" : String(r.capacity),
    active: r.active,
  };
}

function formValuesFromPriceList(pl: PriceList): DrawerFormValues {
  return {
    name: pl.name,
    direction: pl.direction,
    routes: pl.routes.map(draftFromRoute),
    departureTimes: pl.departureTimes.map((dt) => ({
      day: dt.day,
      time: dt.time,
    })),
    luggagePolicy: pl.luggagePolicy,
    notes: pl.notes,
    availType: pl.availability.type,
    schedStart:
      pl.availability.type === "scheduled" ? pl.availability.startDate : "",
    schedEnd:
      pl.availability.type === "scheduled" ? pl.availability.endDate : "",
  };
}

function buildBody(form: DrawerFormValues): PriceListBody {
  const routes = form.routes.map((r) => ({
    name: r.name.trim(),
    price: parseAmount(r.price),
    capacity:
      r.capacityType === "unlimited"
        ? null
        : Math.max(1, parseInt(r.capacityValue, 10) || 1),
    active: r.active,
  }));

  const departureTimes = form.departureTimes.map((d) => ({
    day: d.day,
    time: d.time,
  }));

  const availability: PriceListBody["availability"] =
    form.availType === "scheduled"
      ? {
          type: "scheduled",
          startDate: form.schedStart,
          endDate: form.schedEnd,
        }
      : form.availType === "inactive"
        ? { type: "inactive" }
        : { type: "active" };

  return {
    name: form.name.trim(),
    direction: form.direction,
    routes,
    departureTimes,
    luggagePolicy: form.luggagePolicy,
    notes: form.notes,
    availability,
  };
}

function emptyFormValues(direction: "leaving" | "returning"): DrawerFormValues {
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

// --- Small reusable pieces ---

function parse24(time: string) {
  const [h, m] = time.split(":").map(Number);
  const isPM = h >= 12;
  const hours12 = h % 12 || 12;
  return { hours12, minutes: m ?? 0, isPM };
}

function to24(hours12: number, minutes: number, isPM: boolean) {
  const h = isPM ? (hours12 % 12) + 12 : hours12 % 12;
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { hours12, minutes, isPM } = parse24(value);
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <select
        value={hours12}
        onChange={(e) => onChange(to24(Number(e.target.value), minutes, isPM))}
        className="w-12 px-1 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-portal-muted text-[13px]">:</span>
      <select
        value={minutes}
        onChange={(e) => onChange(to24(hours12, Number(e.target.value), isPM))}
        className="w-14 px-1 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
      >
        {[0, 15, 30, 45].map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
      <div className="flex rounded-md border border-portal-border overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(to24(hours12, minutes, false))}
          className={`px-2 py-1.5 text-[12px] font-semibold transition-colors ${
            !isPM
              ? "bg-portal-accent text-white"
              : "bg-portal-bg text-portal-muted hover:bg-portal-bg2"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => onChange(to24(hours12, minutes, true))}
          className={`px-2 py-1.5 text-[12px] font-semibold transition-colors ${
            isPM
              ? "bg-portal-accent text-white"
              : "bg-portal-bg text-portal-muted hover:bg-portal-bg2"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
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

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-bg text-left focus:outline-none hover:border-portal-accent transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
            <span
              className={selected ? "text-portal-text" : "text-portal-muted/50"}
            >
              {selected ? format(selected, "dd MMM yyyy") : "Pick a date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-xl border-portal-border"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                onChange(`${y}-${m}-${d}`);
              } else {
                onChange("");
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
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
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {fmt(availability.startDate)} – {fmt(availability.endDate)}
    </span>
  );
}

function PriceListCard({ pl, onEdit }: { pl: PriceList; onEdit: () => void }) {
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

function AddCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="text-left w-full border border-dashed border-portal-border rounded-xl p-4 hover:border-portal-accent/50 hover:bg-portal-accent/[0.02] transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-portal-accent/10 flex items-center justify-center flex-shrink-0">
          <Plus className="w-3.5 h-3.5 text-portal-accent" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-portal-text">
            Add price list
          </p>
          <p className="text-[11px] text-portal-muted mt-0.5">
            Set routes, prices & departure times
          </p>
        </div>
      </div>
    </button>
  );
}

// --- Main component ---

export default function RouteManagement() {
  const {
    data: priceLists,
    isLoading,
    isError,
    refetch,
  } = useVendorPriceLists();
  const createMutation = useCreatePriceList();
  const updateMutation = useUpdatePriceList();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    formState: { isDirty: formIsDirty },
  } = useForm<DrawerFormValues>({
    defaultValues: emptyFormValues("leaving"),
  });

  const {
    fields: routeFields,
    append: appendRoute,
    remove: removeRoute,
  } = useFieldArray({ control, name: "routes" });

  const {
    fields: departureFields,
    append: appendDeparture,
    remove: removeDeparture,
  } = useFieldArray({ control, name: "departureTimes" });

  const watchedName = useWatch({ control, name: "name" });
  const watchedDirection = useWatch({ control, name: "direction" });
  const watchedRoutes = useWatch({ control, name: "routes" });
  const watchedDepartureTimes = useWatch({ control, name: "departureTimes" });
  const watchedAvailType = useWatch({ control, name: "availType" });
  const watchedSchedStart = useWatch({ control, name: "schedStart" });
  const watchedSchedEnd = useWatch({ control, name: "schedEnd" });

  const leaving =
    (priceLists ?? []).find((p) => p.direction === "leaving") ?? null;
  const returning =
    (priceLists ?? []).find((p) => p.direction === "returning") ?? null;

  function openNew(direction: "leaving" | "returning") {
    reset(emptyFormValues(direction));
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(pl: PriceList) {
    reset(formValuesFromPriceList(pl));
    setEditingId(pl.id);
    setDrawerOpen(true);
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open && formIsDirty) {
      setDiscardOpen(true);
      return;
    }
    setDrawerOpen(open);
  }

  function confirmDiscard() {
    setDiscardOpen(false);
    setDrawerOpen(false);
  }

  function addRoute() {
    appendRoute({
      name: "",
      price: "",
      capacityType: "number",
      capacityValue: "",
      active: true,
    });
  }

  function addDeparture() {
    appendDeparture({ day: "Monday", time: "08:00" });
  }

  const canSave =
    (!editingId || formIsDirty) &&
    watchedName.trim().length > 0 &&
    watchedRoutes.length >= 1 &&
    watchedDepartureTimes.length >= 1 &&
    (watchedAvailType !== "scheduled" ||
      (!!watchedSchedStart && !!watchedSchedEnd));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function save() {
    if (!canSave || isSaving) return;
    const values = getValues();
    const body = buildBody(values);

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...body });
        toast.success("Price list updated");
      } else {
        await createMutation.mutateAsync(body);
        toast.success("Price list created");
      }
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

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

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-portal-muted">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-[13px]">Loading price lists…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <p className="text-[13px] text-portal-muted">
              Failed to load price lists. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Leaving School */}
            <div className="mb-7">
              <h3 className="text-[14px] font-semibold text-portal-text flex items-center gap-1.5 mb-3">
                <Rocket className="text-primary" size={18} />
                Leaving School
              </h3>
              {leaving ? (
                <PriceListCard pl={leaving} onEdit={() => openEdit(leaving)} />
              ) : (
                <AddCard onAdd={() => openNew("leaving")} />
              )}
            </div>

            {/* Returning to School */}
            <div>
              <h3 className="text-[14px] font-semibold text-portal-text flex items-center gap-1.5 mb-3">
                <House className="text-primary" size={18} />
                Returning to School
              </h3>
              {returning ? (
                <PriceListCard
                  pl={returning}
                  onEdit={() => openEdit(returning)}
                />
              ) : (
                <AddCard onAdd={() => openNew("returning")} />
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Discard confirmation dialog — outside Drawer to avoid focus-trap conflict */}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Discard changes?</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to discard them?
          </DialogDescription>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setDiscardOpen(false)}
              className="flex-1 py-2 text-[13px] font-medium border border-portal-border rounded-lg text-portal-text hover:bg-portal-bg transition-colors"
            >
              Keep editing
            </button>
            <button
              onClick={confirmDiscard}
              className="flex-1 py-2 text-[13px] font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Discard
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        direction="right"
      >
        <DrawerContent
          style={{ width: "min(760px, 100vw)", maxWidth: "min(760px, 100vw)" }}
          className="bg-portal-surface flex flex-col overflow-hidden p-0 !h-[100dvh]"
        >
          <DrawerTitle className="sr-only">
            {editingId ? "Edit Price List" : "New Price List"}
          </DrawerTitle>

          {/* Header */}
          <div className="flex items-start gap-3 px-5 py-4 border-b border-portal-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1">
                Price List Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder={
                  watchedDirection === "leaving"
                    ? "e.g. Mar 2026 Resumption"
                    : "e.g. Weekend Express"
                }
                className="w-full px-3 py-2 text-[14px] font-semibold border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent placeholder:text-portal-muted/50 text-portal-text"
              />
            </div>
            <DrawerClose asChild>
              <button className="mt-6 w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </div>

          {/* Scrollable body — data-vaul-no-drag prevents vaul from treating
              keyboard viewport changes as a drag/dismiss gesture on mobile */}
          <div className="flex-1 overflow-y-auto" data-vaul-no-drag>
            {/* Routes table */}
            <div className="border-b border-portal-border">
              <div className="hidden sm:grid grid-cols-[1fr_120px_200px_36px_32px] gap-2 px-5 py-2.5 bg-portal-bg border-b border-portal-border">
                {["Route", "Price (₦)", "Capacity", "", ""].map((h, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {routeFields.length === 0 && (
                <p className="px-5 py-4 text-[13px] text-portal-muted/60 italic">
                  No routes added yet. Add at least one.
                </p>
              )}

              {routeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_200px_36px_32px] gap-2 px-5 py-3 items-center border-b border-portal-border last:border-b-0"
                >
                  {/* Route name — always full width on its own row */}
                  <input
                    {...register(`routes.${index}.name`)}
                    type="text"
                    placeholder="Route name"
                    className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                  />

                  {/* On mobile: flex row for the remaining controls.
                      On sm+: sm:contents makes children flow into grid cols 2–5. */}
                  <div className="flex items-center gap-2 sm:contents">
                    <Controller
                      name={`routes.${index}.price`}
                      control={control}
                      render={({ field: priceField }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={priceField.value}
                          onChange={(e) =>
                            priceField.onChange(
                              formatWithCommas(e.target.value),
                            )
                          }
                          placeholder="₦ 0"
                          className="w-24 sm:w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                        />
                      )}
                    />

                    <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                      <select
                        {...register(`routes.${index}.capacityType`)}
                        className="flex-1 min-w-0 px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                      >
                        <option value="unlimited">Unlimited</option>
                        <option value="number">Limited</option>
                      </select>
                      {watchedRoutes[index]?.capacityType === "number" && (
                        <input
                          {...register(`routes.${index}.capacityValue`)}
                          type="number"
                          placeholder="Max"
                          min="1"
                          className="w-14 px-1.5 py-1.5 text-[12px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                        />
                      )}
                    </div>

                    <Controller
                      name={`routes.${index}.active`}
                      control={control}
                      render={({ field: activeField }) => (
                        <Toggle
                          on={activeField.value}
                          onChange={activeField.onChange}
                        />
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => removeRoute(index)}
                      className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-auto sm:ml-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

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
                {departureFields.length === 0 && (
                  <p className="text-[13px] text-portal-muted/60 italic mb-2">
                    No departure times yet. Add at least one.
                  </p>
                )}
                <div className="space-y-2">
                  {departureFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <select
                        {...register(`departureTimes.${index}.day`)}
                        className="sm:flex-1 min-w-0 px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <Controller
                          name={`departureTimes.${index}.time`}
                          control={control}
                          render={({ field: timeField }) => (
                            <TimeInput
                              value={timeField.value}
                              onChange={timeField.onChange}
                            />
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => removeDeparture(index)}
                          className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                  Luggage Policy{" "}
                  <span className="normal-case font-normal text-portal-muted/60">
                    (optional)
                  </span>
                </label>
                <textarea
                  {...register("luggagePolicy")}
                  placeholder="e.g. 1 big bag + 1 hand luggage."
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
                  {...register("notes")}
                  placeholder="e.g. Come early to the stand at the front of CAF."
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
                    onClick={() =>
                      setValue("availType", value, { shouldDirty: true })
                    }
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-colors ${
                      watchedAvailType === value
                        ? "border-portal-accent text-portal-accent bg-portal-accent/5"
                        : "border-portal-border text-portal-muted hover:border-portal-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {watchedAvailType === "scheduled" && (
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    name="schedStart"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        label="Start Date"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    name="schedEnd"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        label="End Date"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-portal-border flex-shrink-0">
            <button
              onClick={save}
              disabled={!canSave || isSaving}
              className="w-full py-2.5 text-[14px] font-semibold bg-portal-accent text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-portal-accent2 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Price List"}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
