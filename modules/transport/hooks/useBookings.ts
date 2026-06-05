import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getBookings } from "@/lib/actions/booking.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type {
  StudentBookingsFilters,
  StudentBookingsResponse,
} from "@/modules/transport/transport.types";

export function useBookings(filters: StudentBookingsFilters) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<StudentBookingsResponse>({
    queryKey: queryKeys.bookings.all(userId ?? "", filters),
    queryFn: async () => {
      const result = await getBookings(filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });
}
