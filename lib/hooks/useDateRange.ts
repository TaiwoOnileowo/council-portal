"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { defaultRange } from "@/lib/date";
import { DateRange } from "../types";
export function useDateRange(): [DateRange, (range: DateRange) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const range = from && to ? { from, to } : defaultRange();

  const setRange = useCallback(
    (next: DateRange) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", next.from);
      params.set("to", next.to);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [range, setRange];
}
