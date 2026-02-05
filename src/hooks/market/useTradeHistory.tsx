import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useQuery, UseQueryResult } from "@tanstack/solid-query";
import dbIndexerClient from "@/lib/indexer-client";

type Trade = {
  trade_id: string;
  maker_balance_manager_id: string;
  maker_order_id: string;
  taker_balance_manager_id: string;
  taker_order_id: string;
  type: string;
  price: number;
  base_volume: number;
  quote_volume: number;
  timestamp: number;
};

export function useTradeHistory(
  poolKey: string
): UseQueryResult<Trade[], Error> {
  const network = useCurrentNetwork();

  return useQuery(() => ({
    queryKey: ["tradeHistory", network(), poolKey],
    queryFn: async () =>
      await dbIndexerClient(`/trades/${poolKey}?limit=50`, network()),
    refetchInterval: 1000,
  }));
}
