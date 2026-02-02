import { For, Show } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import { useTradeHistory } from "@/hooks/market/useTradeHistory";

export const TradeHistory = () => {
  const { pool } = useCurrentPool();
  const tradesQuery = useTradeHistory(pool().pool_name);

  return (
    <Show when={!tradesQuery.isLoading} fallback={<div />}>
      <div class="h-full overflow-y-auto font-mono text-xs">
        <table class="w-full">
          <thead class="bg-background text-muted-foreground sticky top-0 border-b text-right text-[10px] uppercase">
            <tr class="h-6">
              <th class="w-1/3 pr-2 pl-2 font-medium whitespace-nowrap">{`Amt (${pool().base_asset_symbol})`}</th>
              <th class="w-1/3 pr-2 font-medium whitespace-nowrap">{`Amt (${pool().quote_asset_symbol})`}</th>
              <th class="w-1/3 pr-2 font-medium whitespace-nowrap">Time</th>
            </tr>
          </thead>
          <tbody>
            <Show when={tradesQuery.data}>
              {(trades) => (
                <For each={trades()}>
                  {(trade) => (
                    <tr class="h-6 text-right">
                      <td class="pr-2 pl-2">{trade.base_volume}</td>
                      <td
                        class={`pr-2 ${
                          trade.type === "buy"
                            ? "text-[#26a69a]"
                            : "text-[#ef5350]"
                        }`}
                      >
                        {trade.quote_volume}
                      </td>
                      <td class="text-muted-foreground pr-2">
                        {new Date(trade.timestamp * 1000).toLocaleTimeString(
                          [],
                          {
                            hour12: false,
                          }
                        )}
                      </td>
                    </tr>
                  )}
                </For>
              )}
            </Show>
          </tbody>
        </table>
      </div>
    </Show>
  );
};
