import { useCurrentNetwork } from "@/contexts/dapp-kit";
import dbIndexerClient from "@/lib/indexer-client";
import {
  useInfiniteQuery,
  UseInfiniteQueryResult,
  InfiniteData,
} from "@tanstack/solid-query";

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
  poolKey: string | (() => string),
  maker?: string | (() => string | undefined),
  taker?: string | (() => string | undefined),
  limit?: number
): UseInfiniteQueryResult<InfiniteData<Trade[], number>, Error> {
  const network = useCurrentNetwork();
  const getPoolKey = typeof poolKey === "function" ? poolKey : () => poolKey;
  const getMaker = typeof maker === "function" ? maker : () => maker;
  const getTaker = typeof taker === "function" ? taker : () => taker;

  return useInfiniteQuery(() => ({
    queryKey: [
      "accountTradeHistory",
      network(),
      getPoolKey(),
      getMaker(),
      getTaker(),
      limit,
    ],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        limit: (limit || 50).toString(),
        end_time: Math.floor(pageParam / 1000).toString(),
      });

      const makerValue = getMaker();
      const takerValue = getTaker();
      if (makerValue)
        searchParams.append("maker_balance_manager_id", makerValue);
      if (takerValue)
        searchParams.append("taker_balance_manager_id", takerValue);

      return await dbIndexerClient(
        `/trades/${getPoolKey()}?${searchParams.toString()}`,
        network()
      );
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].timestamp;
    },
    getPreviousPageParam: (firstPage) => {
      if (!firstPage || firstPage.length === 0) return undefined;
      return firstPage[0].timestamp;
    },
    initialPageParam: Date.now(),
    enabled: !!getMaker() || !!getTaker(),
  }));
}
