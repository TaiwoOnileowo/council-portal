"use client";

import Toggle from "@/components/ui/Toggle";
import { formatWithCommas } from "@/lib/format";
import type { DrawerFormValues } from "@/modules/transport/transport.utils";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import DepartureTimesEditor from "./DepartureTimesEditor";
import RouteStopsEditor from "./RouteStopsEditor";

const fieldLabelClass =
  "block text-[10px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1";

export default function RouteRow({
  control,
  register,
  index,
  errors,
  name,
  price,
  onRemove,
  onCopyDeparturesToAll,
}: {
  control: Control<DrawerFormValues>;
  register: UseFormRegister<DrawerFormValues>;
  index: number;
  errors: FieldErrors<DrawerFormValues>;
  name: string | undefined;
  price: string | undefined;
  onRemove: () => void;
  onCopyDeparturesToAll: () => void;
}) {
  const [editing, setEditing] = useState(!name);

  function finishEditing(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      setEditing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_36px_32px] gap-2 px-5 py-3 items-center border-b border-portal-border last:border-b-0">
      {editing ? (
        <div className="flex items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <label className={fieldLabelClass}>Route Name</label>
            <input
              {...register(`routes.${index}.name`)}
              type="text"
              placeholder="e.g. Ikeja"
              onKeyDown={finishEditing}
              className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-accent-bg/50 focus:outline-none focus:border-portal-accent"
            />
            {errors.routes?.[index]?.name && (
              <p className="mt-1 text-[11px] text-red-500">
                {errors.routes[index]?.name?.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(false)}
            title="Done editing"
            className="mt-5 w-7 h-7 flex items-center justify-center text-portal-muted hover:text-portal-accent transition-colors flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="sm:col-span-2 flex items-center gap-2 min-w-0 px-2 py-1.5">
          <span className="text-[13px] font-medium text-portal-text truncate">
            {name || "Untitled route"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Edit route"
            className="w-6 h-6 flex items-center justify-center text-portal-muted hover:text-portal-accent hover:bg-portal-accent-bg/50 rounded-md transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] text-portal-muted truncate flex-shrink-0">
            ₦{formatWithCommas(String(price || "0"))}
          </span>
        </div>
      )}

      {editing && (
        <div>
          <label className={fieldLabelClass}>Price (₦)</label>
          <Controller
            name={`routes.${index}.price`}
            control={control}
            render={({ field: priceField }) => (
              <input
                type="text"
                inputMode="numeric"
                value={priceField.value}
                onChange={(e) =>
                  priceField.onChange(formatWithCommas(e.target.value))
                }
                onKeyDown={finishEditing}
                placeholder="₦ 0"
                className="w-24 sm:w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-md bg-portal-accent-bg/50 focus:outline-none focus:border-portal-accent"
              />
            )}
          />
        </div>
      )}

      <div className="flex items-center gap-2 sm:contents">
        <Controller
          name={`routes.${index}.active`}
          control={control}
          render={({ field: activeField }) => (
            <Toggle on={activeField.value} onChange={activeField.onChange} />
          )}
        />
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center text-portal-muted hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-auto sm:ml-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <RouteStopsEditor control={control} routeIndex={index} />
      <DepartureTimesEditor
        control={control}
        routeIndex={index}
        onCopyToAll={onCopyDeparturesToAll}
      />
    </div>
  );
}
