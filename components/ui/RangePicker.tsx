"use client";

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { parseISO, subDays, subMonths, startOfMonth } from "date-fns";
import type { DateRange as RDPRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatRangeLabel, toISODate } from "@/lib/date";
import { DateRange } from "@/lib/types";

interface RangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; build: () => DateRange }[] = [
  {
    label: "Last 7 days",
    build: () => ({
      from: toISODate(subDays(new Date(), 6)),
      to: toISODate(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    build: () => ({
      from: toISODate(subDays(new Date(), 29)),
      to: toISODate(new Date()),
    }),
  },
  {
    label: "Last 90 days",
    build: () => ({
      from: toISODate(subDays(new Date(), 89)),
      to: toISODate(new Date()),
    }),
  },
  {
    label: "This month",
    build: () => ({
      from: toISODate(startOfMonth(new Date())),
      to: toISODate(new Date()),
    }),
  },
];

export default function RangePicker({ value, onChange }: RangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RDPRange | undefined>({
    from: parseISO(value.from),
    to: parseISO(value.to),
  });

  useEffect(() => {
    setDraft({ from: parseISO(value.from), to: parseISO(value.to) });
  }, [value.from, value.to]);

  function handleSelect(range: RDPRange | undefined, selectedDate: Date) {
    if (draft?.from && draft?.to) {
      setDraft({ from: selectedDate, to: undefined });
      return;
    }
    setDraft(range);
    if (range?.from && range?.to) {
      onChange({ from: toISODate(range.from), to: toISODate(range.to) });
      setOpen(false);
    }
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    onChange(preset.build());
    setOpen(false);
  }

  const previewStart = draft?.from && !draft?.to ? draft.from : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 bg-portal-surface border border-portal-border rounded-xl px-3 py-2 self-start sm:self-auto",
            "text-[12.5px] font-medium text-portal-text2 hover:border-portal-accent/40 hover:text-portal-text transition-colors",
            open && "border-portal-accent/40 text-portal-text",
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
          {formatRangeLabel(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="flex w-auto max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden rounded-xl border border-portal-border bg-portal-surface p-0 sm:flex-row"
      >
        <div className="flex flex-row flex-wrap gap-1 border-b border-portal-border p-2 sm:flex-col sm:flex-nowrap sm:gap-0.5 sm:border-b-0 sm:border-r sm:min-w-[140px]">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="rounded-lg px-3 py-2 text-left text-[12.5px] text-portal-text2 transition-colors hover:bg-portal-bg hover:text-portal-text"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          showOutsideDays={false}
          defaultMonth={subMonths(parseISO(value.to), 1)}
          selected={draft}
          onSelect={handleSelect}
          disabled={{ after: new Date() }}
          modifiers={
            previewStart ? { rangeStartPreview: previewStart } : undefined
          }
          modifiersClassNames={{
            rangeStartPreview:
              "rounded-lg [&>button]:bg-portal-accent [&>button]:text-white [&>button]:hover:bg-portal-accent",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
