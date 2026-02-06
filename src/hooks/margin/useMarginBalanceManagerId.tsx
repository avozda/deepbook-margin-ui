import { useQuery } from "@tanstack/solid-query";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useMarginManager } from "@/contexts/margin-manager";
import { MarginIndexerClient } from "@/lib/margin-indexer-client";

export function useMarginBalanceManagerId() {
  const network = useCurrentNetwork();
  const { marginManagerAddress, hasMarginManager } = useMarginManager();

  return useQuery(() => ({
    queryKey: ["marginBalanceManagerId", network(), marginManagerAddress()],
    queryFn: async (): Promise<string | null> => {
      const managerId = marginManagerAddress();
      if (!managerId) return null;

      const indexer = new MarginIndexerClient(network());
      const events = await indexer.getMarginManagerCreated(managerId);

      if (events.length === 0) return null;
      return events[0].balance_manager_id;
    },
    enabled: hasMarginManager() && !!marginManagerAddress(),
    staleTime: 60 * 60 * 1000,
    retry: 2,
    throwOnError: false,
  }));
}
