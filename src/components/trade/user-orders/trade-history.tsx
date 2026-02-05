import { createMemo, For, Show } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useTradeHistory } from "@/hooks/account/useTradeHistory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const UserTradeHistory = () => {
  const { pool } = useCurrentPool();
  const { balanceManagerAddress } = useBalanceManager();
  const makerOrders = useTradeHistory(
    () => pool().pool_name,
    () => balanceManagerAddress()
  );
  const takerOrders = useTradeHistory(
    () => pool().pool_name,
    undefined,
    () => balanceManagerAddress()
  );

  const sortedOrders = createMemo(() => {
    const makerHistory = makerOrders.data?.pages.flatMap((page) => page) || [];
    const takerHistory = takerOrders.data?.pages.flatMap((page) => page) || [];
    return [...makerHistory, ...takerHistory].sort(
      (a, b) => b.timestamp - a.timestamp
    );
  });

  return (
    <div class="relative h-full">
      <Show
        when={sortedOrders().length > 0}
        fallback={
          <div class="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs">
            <svg
              class="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>No trade history</div>
          </div>
        }
      >
        <Table>
          <TableHeader class="bg-background text-muted-foreground sticky top-0 text-xs [&_tr]:border-none">
            <TableRow>
              <TableHead class="pl-4">TIME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>PRICE ({pool().quote_asset_symbol})</TableHead>
              <TableHead>QUANTITY ({pool().base_asset_symbol})</TableHead>
              <TableHead>TOTAL ({pool().quote_asset_symbol})</TableHead>
              <TableHead class="pr-4 text-right">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="text-xs [&_tr]:border-none">
            <For each={sortedOrders()}>
              {(order) => (
                <TableRow>
                  <TableCell class="text-muted-foreground pl-4">
                    {new Date(order.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell
                    class={
                      order.type === "buy" ? "text-[#26a69a]" : "text-[#ef5350]"
                    }
                  >
                    {order.type.toUpperCase()}
                  </TableCell>
                  <TableCell>{order.price}</TableCell>
                  <TableCell>{order.base_volume}</TableCell>
                  <TableCell>
                    {(order.base_volume * order.price).toFixed(4)}
                  </TableCell>
                  <TableCell class="pr-4 text-right font-mono">
                    {order.trade_id.slice(0, 8)}...
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
    </div>
  );
};
