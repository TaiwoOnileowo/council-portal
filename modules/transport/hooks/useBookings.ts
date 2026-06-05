import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getBookings } from "@/lib/actions/booking.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type { StudentBookingsResponse } from "@/modules/transport/transport.types";

export function useBookings(page = 0) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<StudentBookingsResponse>({
    queryKey: queryKeys.bookings.all(userId ?? "", page),
    queryFn: async () => {
      const result = await getBookings(page);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });
}
