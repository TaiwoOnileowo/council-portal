"use client";

import { useQuery } from "@tanstack/react-query";
import { getBanks } from "@/lib/actions/bank.action";
import type { Bank } from "@/lib/actions/bank.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: queryKeys.banks.all(),
    queryFn: async () => {
      const { banks, error } = await getBanks();
      if (error || !banks) throw new Error(error ?? "Failed to load banks.");
      return banks;
    },
    staleTime: STALE.STATIC,
  });
}
