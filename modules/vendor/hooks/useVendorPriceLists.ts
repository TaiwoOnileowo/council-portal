import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVendorPriceLists,
  createPriceList,
  updatePriceList,
} from "@/lib/actions/vendor.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import type { PriceList, PriceListBody } from "@/modules/vendor/vendor.types";

export function useVendorPriceLists() {
  return useQuery<PriceList[]>({
    queryKey: queryKeys.vendor.priceLists(),
    queryFn: async () => {
      const result = await getVendorPriceLists();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useMutation<PriceList, Error, PriceListBody>({
    mutationFn: async (body) => {
      const result = await createPriceList(body);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor.priceLists() });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();
  return useMutation<PriceList, Error, { id: string } & PriceListBody>({
    mutationFn: async ({ id, ...body }) => {
      const result = await updatePriceList(id, body);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor.priceLists() });
    },
  });
}
