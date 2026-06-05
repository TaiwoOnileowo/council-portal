import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getTransportBookings } from "@/lib/actions/transport.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type { BookingsFilters, TransportBookingsResponse } from "@/modules/transport/transport.types";

export function useTransportBookings(filters: BookingsFilters) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<TransportBookingsResponse>({
    queryKey: queryKeys.vendor.bookings(userId ?? "", filters),
    queryFn: async () => {
      const result = await getTransportBookings(filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.FREQUENT,
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });
}
