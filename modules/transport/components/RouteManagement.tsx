"use client";

import DatePickerField from "@/components/ui/DatePickerField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import Select from "@/components/ui/Select";
import TimeInput from "@/components/ui/TimeInput";
import Toggle from "@/components/ui/Toggle";
import { formatWithCommas } from "@/lib/format";
import {
  useCreatePriceList,
  useTransportPriceLists,
  useUpdatePriceList,
} from "@/modules/transport/hooks/useTransportPriceLists";
import type { PriceList } from "@/modules/transport/transport.types";
import {
  type DrawerFormValues,
  buildBody,
  emptyFormValues,
  formValuesFromPriceList,
} from "@/modules/transport/transport.utils";
import {
  House,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import AddCard from "./AddCard";
import PriceListCard from "./PriceListCard";

export default function RouteManagement() {
  const {
    data: priceLists,
    isLoading,
    isError,
    refetch,
  } = useTransportPriceLists();
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
      capacityType: "unlimited",
      capacityValue: "",
      active: true,
    });
  }

  function addDeparture() {
    appendDeparture({ date: "", time: "08:00" });
  }

  const canSave =
    (!editingId || formIsDirty) &&
    watchedName.trim().length > 0 &&
    watchedRoutes.length >= 1 &&
    watchedDepartureTimes.length >= 1 &&
    watchedDepartureTimes.every((d) => !!d?.date) &&
    (watchedAvailType !== "scheduled" ||
      (!!watchedSchedStart && !!watchedSchedEnd));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function save() {
    if (!canSave || isSaving) return;
    const body = buildBody(getValues());
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
      <div>
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
      </div>

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

          {/* data-vaul-no-drag prevents vaul from treating keyboard viewport changes as a dismiss gesture on mobile */}
          <div className="flex-1 overflow-y-auto" data-vaul-no-drag>
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
                  <input
                    {...register(`routes.${index}.name`)}
                    type="text"
                    placeholder="Route name"
                    className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-bg focus:outline-none focus:border-portal-accent"
                  />

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
                      <div className="flex-1 min-w-0">
                        <Controller
                          name={`routes.${index}.capacityType`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              size="sm"
                              className="px-2 py-1.5 text-[13px] rounded-md"
                              options={[
                                { value: "unlimited", label: "Unlimited" },
                                { value: "number", label: "Limited" },
                              ]}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
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

              <div className="px-5 py-3">
                <button
                  type="button"
                  onClick={addRoute}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Route
                </button>
              </div>
            </div>

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
                      <div className="sm:flex-1 min-w-0">
                        <Controller
                          name={`departureTimes.${index}.date`}
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Pick a date"
                            />
                          )}
                        />
                      </div>
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
