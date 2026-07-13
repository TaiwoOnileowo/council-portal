"use client";

import DatePickerField from "@/components/ui/DatePickerField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import Select from "@/components/ui/Select";
import TimeInput from "@/components/ui/TimeInput";
import type { DrawerFormValues } from "@/modules/transport/transport.utils";
import { Check, ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  type Control,
  useFieldArray,
  useWatch,
} from "react-hook-form";

const fieldLabelClass =
  "block text-[10px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1";

function DepartureRow({
  control,
  routeIndex,
  index,
  onRemove,
}: {
  control: Control<DrawerFormValues>;
  routeIndex: number;
  index: number;
  onRemove: () => void;
}) {
  const capacityType = useWatch({
    control,
    name: `routes.${routeIndex}.departureTimes.${index}.capacityType`,
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
      <div className="sm:flex-1 min-w-0">
        {index === 0 && <label className={fieldLabelClass}>Date</label>}
        <Controller
          name={`routes.${routeIndex}.departureTimes.${index}.date`}
          control={control}
          render={({ field: dateField }) => (
            <DatePickerField
              value={dateField.value}
              onChange={dateField.onChange}
              placeholder="Pick a date"
            />
          )}
        />
      </div>
      <div className="flex items-end gap-2">
        <div>
          {index === 0 && <label className={fieldLabelClass}>Time</label>}
          <Controller
            name={`routes.${routeIndex}.departureTimes.${index}.time`}
            control={control}
            render={({ field: timeField }) => (
              <TimeInput value={timeField.value} onChange={timeField.onChange} />
            )}
          />
        </div>
        <div className="flex items-end gap-1.5">
          <div className="w-28 flex-shrink-0">
            {index === 0 && <label className={fieldLabelClass}>Capacity</label>}
            <Controller
              name={`routes.${routeIndex}.departureTimes.${index}.capacityType`}
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
          {capacityType === "number" && (
            <Controller
              name={`routes.${routeIndex}.departureTimes.${index}.capacityValue`}
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Max"
                  className="w-14 px-1.5 py-1.5 text-[12px] border border-portal-border rounded-md bg-portal-accent-bg/50 focus:outline-none focus:border-portal-accent"
                />
              )}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function DepartureTimesEditor({
  control,
  routeIndex,
  onCopyToAll,
}: {
  control: Control<DrawerFormValues>;
  routeIndex: number;
  onCopyToAll: () => void;
}) {
  const {
    fields: departureFields,
    append: appendDeparture,
    remove: removeDeparture,
  } = useFieldArray({ control, name: `routes.${routeIndex}.departureTimes` });

  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  function confirmApplyToAll() {
    onCopyToAll();
    setConfirmOpen(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 1800);
  }

  return (
    <div className="sm:col-span-full pl-0 sm:pl-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-portal-muted hover:text-portal-text transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        Departure Times{" "}
        <span className="normal-case font-normal text-portal-muted/60">
          ({departureFields.length > 0 ? `${departureFields.length} added` : "none yet"})
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5">
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {departureFields.map((field, index) => (
              <DepartureRow
                key={field.id}
                control={control}
                routeIndex={routeIndex}
                index={index}
                onRemove={() => removeDeparture(index)}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                appendDeparture({
                  date: "",
                  time: "08:00",
                  capacityType: "unlimited",
                  capacityValue: "",
                })
              }
              className="flex items-center gap-1 text-[12px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Departure
            </button>
            {departureFields.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                title="Replace every other route's departure times with this route's list"
                disabled={applied}
                className="flex items-center gap-1 text-[12px] font-medium text-portal-muted hover:text-portal-text transition-colors disabled:text-portal-green"
              >
                {applied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Applied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Apply to all routes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Apply to all routes?</DialogTitle>
          <DialogDescription>
            This replaces the departure times on every other route in this
            price list with the ones from this route. Existing times on
            those routes will be lost.
          </DialogDescription>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-2 text-[13px] font-medium border border-portal-border rounded-lg text-portal-text hover:bg-portal-accent-bg/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmApplyToAll}
              className="flex-1 py-2 text-[13px] font-semibold bg-portal-accent text-white rounded-lg hover:bg-portal-accent2 transition-colors"
            >
              Apply
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
