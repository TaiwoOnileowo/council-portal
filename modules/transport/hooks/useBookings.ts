import { useQuery } from "@tanstack/react-query";
import { getBookings } from "@/lib/actions/booking.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import type { StudentBooking } from "@/modules/transport/transport.types";

export function useBookings() {
  return useQuery<StudentBooking[]>({
    queryKey: queryKeys.bookings.all(),
    queryFn: async () => {
      const result = await getBookings();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
  });
}
