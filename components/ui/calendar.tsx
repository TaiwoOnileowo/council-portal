"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-5",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-[13px] font-semibold text-portal-text",
        nav: "absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-0.5",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-portal-muted hover:bg-portal-bg hover:text-portal-text transition-colors disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-portal-muted hover:bg-portal-bg hover:text-portal-text transition-colors disabled:pointer-events-none disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[11px] font-normal text-portal-muted",
        week: "flex w-full mt-1",
        day: cn(
          "relative w-9 p-0 text-center text-[12.5px] focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-portal-accent-bg",
          "first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
        ),
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-lg font-normal text-portal-text transition-colors hover:bg-portal-bg",
        range_start:
          "rounded-l-lg [&>button]:bg-portal-accent [&>button]:text-white [&>button]:hover:bg-portal-accent",
        range_end:
          "rounded-r-lg [&>button]:bg-portal-accent [&>button]:text-white [&>button]:hover:bg-portal-accent",
        range_middle:
          "[&>button]:bg-transparent [&>button]:text-portal-text [&>button]:hover:bg-portal-accent-bg",
        today: "[&>button]:font-semibold [&>button]:text-portal-accent",
        outside: "[&>button]:text-portal-muted/40",
        disabled:
          "[&>button]:cursor-not-allowed [&>button]:text-portal-muted/30 [&>button]:hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className={cn("h-4 w-4", chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
