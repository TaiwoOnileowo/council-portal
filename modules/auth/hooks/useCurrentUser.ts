"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/actions/user.action";

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export const CURRENT_USER_KEY = ["current-user"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });
}
