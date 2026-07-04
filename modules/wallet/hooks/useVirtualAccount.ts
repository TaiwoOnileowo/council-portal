import { useQuery } from "@tanstack/react-query";
import { getOrCreateVirtualAccount } from "@/lib/actions/virtual-account.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

export function useVirtualAccount({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? "";

  return useQuery({
    queryKey: queryKeys.virtualAccount.all(userId),
    queryFn: () => getOrCreateVirtualAccount(),
    enabled: !!userId && enabled,
    staleTime: STALE.SLOW,
  });
}
