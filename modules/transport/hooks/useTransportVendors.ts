import { useQuery } from "@tanstack/react-query";
import { getPublicTransports } from "@/lib/actions/transport.action";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/query-config";

export function useTransportVendors() {
  return useQuery({
    queryKey: queryKeys.transport.vendors(),
    queryFn: getPublicTransports,
    staleTime: STALE.MODERATE,
  });
}
