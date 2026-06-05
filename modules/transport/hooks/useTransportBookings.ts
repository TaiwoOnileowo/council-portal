import { useQuery } from "@tanstack/react-query";
import { getTransportBookings } from "@/lib/actions/transport.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import type { BookingsFilters, TransportBookingsResponse } from "@/modules/transport/transport.types";

export function useTransportBookings(filters: BookingsFilters) {
  return useQuery<TransportBookingsResponse>({
    queryKey: queryKeys.vendor.bookings(filters),
    queryFn: async () => {
      const result = await getTransportBookings(filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.FREQUENT,
  });
}
