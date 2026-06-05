import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransportPriceLists,
  createPriceList,
  updatePriceList,
} from "@/lib/actions/transport.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type { PriceList, PriceListBody } from "@/modules/transport/transport.types";

export function useTransportPriceLists() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<PriceList[]>({
    queryKey: queryKeys.vendor.priceLists(userId ?? ""),
    queryFn: async () => {
      const result = await getTransportPriceLists();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
    enabled: !!userId,
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation<PriceList, Error, PriceListBody>({
    mutationFn: async (body) => {
      const result = await createPriceList(body);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor.priceLists(user.id) });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation<PriceList, Error, { id: string } & PriceListBody>({
    mutationFn: async ({ id, ...body }) => {
      const result = await updatePriceList(id, body);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      if (!user?.id) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor.priceLists(user.id) });
    },
  });
}
