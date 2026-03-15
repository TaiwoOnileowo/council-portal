import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PriceList } from "@/components/portal/vendor-dashboard/vendorDashboardData";
import type { PriceListBody } from "@/lib/validations/vendor";

const QUERY_KEY = ["vendor", "price-lists"] as const;

export function useVendorPriceLists() {
  return useQuery<PriceList[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/vendor/price-lists");
      if (!res.ok) throw new Error("Failed to fetch price lists");
      const data = await res.json();
      return data.priceLists as PriceList[];
    },
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();

  return useMutation<PriceList, Error, PriceListBody>({
    mutationFn: async (body) => {
      const res = await fetch("/api/vendor/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create price list");
      return data.priceList as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();

  return useMutation<PriceList, Error, { id: string } & PriceListBody>({
    mutationFn: async ({ id, ...body }) => {
      const res = await fetch(`/api/vendor/price-lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update price list");
      return data.priceList as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
