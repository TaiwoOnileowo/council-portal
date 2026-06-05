"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/actions/user.action";
import { queryKeys } from "@/lib/query-keys";

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
}
