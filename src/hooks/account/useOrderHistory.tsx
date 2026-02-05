import {
  useInfiniteQuery,
  UseInfiniteQueryResult,
  InfiniteData,
} from "@tanstack/solid-query";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import dbIndexerClient from "@/lib/indexer-client";

export type Order = {
  order_id: string;
  price: number;
  original_quantity: number;
  remaining_quantity: number;
  filled_quantity: number;
  timestamp: number;
  type: "buy" | "sell";
  balance_manager_id: string;
  status: "Placed" | "Modified" | "Canceled" | "Expired" | "Filled";
};

export function useOrderHistory(
  poolKey: string | (() => string),
  balanceManagerId: string | (() => string),
  limit?: number
): UseInfiniteQueryResult<InfiniteData<Order[], number>, Error> {
  const network = useCurrentNetwork();
  const getPoolKey = typeof poolKey === "function" ? poolKey : () => poolKey;
  const getBalanceManagerId =
    typeof balanceManagerId === "function"
      ? balanceManagerId
      : () => balanceManagerId;

  return useInfiniteQuery(() => ({
    queryKey: [
      "orderUpdates",
      network(),
      getPoolKey(),
      getBalanceManagerId(),
      limit,
    ],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        balance_manager_id: getBalanceManagerId(),
        limit: (limit || 50).toString(),
        end_time: Math.floor(pageParam / 1000).toString(),
      });

      return (await dbIndexerClient(
        `/order_updates/${getPoolKey()}?${searchParams.toString()}`,
        network()
      )) as Order[];
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
    enabled: !!getBalanceManagerId() && getBalanceManagerId().length > 0,
  }));
}
