import { useQuery } from "@tanstack/react-query";
import { getNextBooking } from "@/lib/actions/booking.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type { StudentBooking } from "@/modules/transport/transport.types";

export function useNextBooking() {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<StudentBooking | null>({
    queryKey: queryKeys.bookings.next(userId ?? ""),
    queryFn: async () => {
      const result = await getNextBooking();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.MODERATE,
    enabled: !!userId,
  });
}
