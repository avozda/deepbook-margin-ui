import { createMemo, For, Show } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useOrderHistory } from "@/hooks/account/useOrderHistory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const OrderHistory = () => {
  const { pool } = useCurrentPool();
  const { balanceManagerAddress } = useBalanceManager();
  const orders = useOrderHistory(
    pool().pool_name,
    balanceManagerAddress() ?? ""
  );

  const sortedOrders = createMemo(() => {
    const allOrders = orders.data?.pages.flatMap((page) => page) || [];
    return allOrders.sort((a, b) => b.timestamp - a.timestamp);
  });

  return (
    <div class="relative h-full min-w-fit overflow-y-auto">
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
            <div>No order history</div>
          </div>
        }
      >
        <Table>
          <TableHeader class="bg-background text-muted-foreground sticky top-0 text-xs [&_tr]:border-none">
            <TableRow>
              <TableHead class="pl-4">TIME PLACED</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>PRICE ({pool().quote_asset_symbol})</TableHead>
              <TableHead>QUANTITY ({pool().base_asset_symbol})</TableHead>
              <TableHead>TOTAL ({pool().quote_asset_symbol})</TableHead>
              <TableHead>ID</TableHead>
              <TableHead class="pr-4 text-right">STATUS</TableHead>
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
                  <TableCell>{`${order.filled_quantity} / ${order.original_quantity}`}</TableCell>
                  <TableCell>
                    {(order.filled_quantity * order.price).toFixed(4)}
                  </TableCell>
                  <TableCell class="font-mono">
                    {order.order_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell class="pr-4 text-right">{order.status}</TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
    </div>
  );
};
