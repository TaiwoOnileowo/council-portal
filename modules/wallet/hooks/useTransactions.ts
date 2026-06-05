import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getTransactionHistory } from "@/lib/actions/wallet.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import type {
  WalletTransactionsFilters,
  WalletTransactionsResponse,
} from "@/modules/wallet/wallet.types";

export function useTransactions(filters: WalletTransactionsFilters) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  return useQuery<WalletTransactionsResponse>({
    queryKey: queryKeys.wallet.transactions(userId ?? "", filters),
    queryFn: async () => {
      const result = await getTransactionHistory(filters);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: STALE.FREQUENT,
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });
}
