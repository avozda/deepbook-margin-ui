import { createMemo, Show } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import { useSummary } from "@/hooks/market/useSummary";
import { useOrderbook } from "@/hooks/market/useOrderbook";

export const MarketStats = () => {
  const { pool } = useCurrentPool();
  const summaryQuery = useSummary();
  const orderbookQuery = useOrderbook();

  const pair = createMemo(() =>
    summaryQuery.data?.find((p) => p.trading_pairs === pool().pool_name)
  );

  const midPrice = createMemo(() => {
    const data = orderbookQuery.data;
    if (!data?.bids[0] || !data?.asks[0]) return undefined;
    return (data.bids[0].price + data.asks[0].price) / 2;
  });

  const isLoading = () => summaryQuery.isLoading || orderbookQuery.isLoading;

  const formatPrice = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });

  const formatVolume = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatPercent = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div class="flex items-center gap-6 text-xs">
      <Show
        when={!isLoading() && pair() && midPrice()}
        fallback={
          <div class="flex items-center gap-6">
            <div class="flex flex-col">
              <span class="text-muted-foreground">PRICE</span>
              <span>--</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground">24H CHANGE</span>
              <span>--</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground">24H VOLUME</span>
              <span>--</span>
            </div>
            <div class="hidden flex-col md:flex">
              <span class="text-muted-foreground">24H HIGH</span>
              <span>--</span>
            </div>
            <div class="hidden flex-col md:flex">
              <span class="text-muted-foreground">24H LOW</span>
              <span>--</span>
            </div>
          </div>
        }
      >
        <div class="flex flex-col">
          <span class="text-muted-foreground">PRICE</span>
          <span class="font-medium">${formatPrice(midPrice()!)}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-muted-foreground">24H CHANGE</span>
          <span
            class={
              pair()!.price_change_percent_24h >= 0
                ? "text-[#26a69a]"
                : "text-[#ef5350]"
            }
          >
            {pair()!.price_change_percent_24h >= 0 ? "+" : ""}
            {formatPercent(pair()!.price_change_percent_24h)}%
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-muted-foreground">24H VOLUME</span>
          <span>
            ${formatVolume(pair()!.base_volume + pair()!.quote_volume)}
          </span>
        </div>
        <div class="hidden flex-col md:flex">
          <span class="text-muted-foreground">24H HIGH</span>
          <span>${formatPrice(pair()!.highest_price_24h)}</span>
        </div>
        <div class="hidden flex-col md:flex">
          <span class="text-muted-foreground">24H LOW</span>
          <span>${formatPrice(pair()!.lowest_price_24h)}</span>
        </div>
      </Show>
    </div>
  );
};
