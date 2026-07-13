"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, type Control, useFieldArray } from "react-hook-form";
import type { DrawerFormValues } from "@/modules/transport/transport.utils";

export default function RouteStopsEditor({
  control,
  routeIndex,
}: {
  control: Control<DrawerFormValues>;
  routeIndex: number;
}) {
  const {
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
    swap: swapStops,
  } = useFieldArray({ control, name: `routes.${routeIndex}.stops` });

  const [expanded, setExpanded] = useState(false);

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
        Pickup/Drop-off Stops{" "}
        <span className="normal-case font-normal text-portal-muted/60">
          ({stopFields.length > 0 ? `${stopFields.length} added` : "optional"})
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5">
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {stopFields.map((field, stopIndex) => (
              <div key={field.id} className="flex items-center gap-1.5">
                <Controller
                  name={`routes.${routeIndex}.stops.${stopIndex}.name`}
                  control={control}
                  render={({ field: nameField }) => (
                    <input
                      {...nameField}
                      type="text"
                      placeholder="e.g. Berger"
                      className="flex-1 min-w-0 px-2 py-1.5 text-[12px] border border-portal-border rounded-md bg-portal-accent-bg/50 focus:outline-none focus:border-portal-accent"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => swapStops(stopIndex, stopIndex - 1)}
                  disabled={stopIndex === 0}
                  className="w-6 h-6 flex items-center justify-center text-portal-muted hover:text-portal-text disabled:opacity-30 disabled:hover:text-portal-muted"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => swapStops(stopIndex, stopIndex + 1)}
                  disabled={stopIndex === stopFields.length - 1}
                  className="w-6 h-6 flex items-center justify-center text-portal-muted hover:text-portal-text disabled:opacity-30 disabled:hover:text-portal-muted"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeStop(stopIndex)}
                  className="w-6 h-6 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendStop({ name: "" })}
            className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Stop
          </button>
        </div>
      )}
    </div>
  );
}
