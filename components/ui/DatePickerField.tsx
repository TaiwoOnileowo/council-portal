import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] border border-portal-border rounded-lg bg-portal-accent-bg/50 text-left focus:outline-none hover:border-portal-accent transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
            <span
              className={selected ? "text-portal-text" : "text-portal-muted/50"}
            >
              {selected ? format(selected, "dd MMM yyyy") : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-xl border-portal-border"
          align="start"
        >
          <Calendar
            className="[--cell-size:2.4rem]"
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
