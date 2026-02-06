import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";
import dbIndexerClient, { type Network } from "@/lib/indexer-client";
import { useQuery } from "@tanstack/solid-query";

export type OrderbookEntry = {
  price: number;
  amount: number;
};

type OrderbookInfo = {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spreadAmount: number;
  spreadPercent: number;
};

async function fetchOrderbookInfo(
  poolKey: string,
  network: Network,
  depth: number = 30
): Promise<OrderbookInfo> {
  const data = await dbIndexerClient(
    `/orderbook/${poolKey}?depth=${depth}`,
    network
  );

  const asks: OrderbookEntry[] = (data.asks ?? []).map(
    (ask: [string, string]) => ({
      price: parseFloat(ask[0]),
      amount: parseFloat(ask[1]),
    })
  );

  const bids: OrderbookEntry[] = (data.bids ?? []).map(
    (bid: [string, string]) => ({
      price: parseFloat(bid[0]),
      amount: parseFloat(bid[1]),
    })
  );

  const spreadAmount =
    asks.length > 0 && bids.length > 0 ? asks[0].price - bids[0].price : 0;
  const spreadPercent =
    asks.length > 0 && bids.length > 0
      ? (spreadAmount / bids[0].price) * 100
      : 0;

  return {
    asks,
    bids,
    spreadAmount,
    spreadPercent,
  };
}

export function useOrderbook() {
  const network = useCurrentNetwork();
  const { pool } = useCurrentPool();

  return useQuery(() => ({
    queryKey: ["orderbook", network(), pool().pool_name],
    queryFn: async () => await fetchOrderbookInfo(pool().pool_name, network()),
    refetchInterval: 1000,
    retry: 2,
    throwOnError: false,
  }));
}
