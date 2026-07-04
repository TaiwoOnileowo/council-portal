import { useQuery } from "@tanstack/react-query";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import { queryKeys } from "@/lib/query-keys";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

export function useWalletBalance({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? "";

  const query = useQuery({
    queryKey: queryKeys.wallet.all(userId),
    queryFn: () => getWalletBalance(),
    enabled: !!userId && enabled,
  });

  const balanceKobo =
    query.data && "balance" in query.data && query.data.balance != null
      ? query.data.balance
      : null;

  return { ...query, balanceKobo };
}
