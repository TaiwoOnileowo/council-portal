import { useQuery } from "@tanstack/react-query";
import { getVendorBookings } from "@/lib/actions/vendor.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import type { BookingsFilters, VendorBookingsResponse } from "@/modules/vendor/vendor.types";

export function useVendorBookings(filters: BookingsFilters) {
  return useQuery<VendorBookingsResponse>({
    queryKey: queryKeys.vendor.bookings(filters),
    queryFn: async () => {
      const result = await getVendorBookings(filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.FREQUENT,
  });
}
