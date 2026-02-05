import { createSignal, createMemo, For, Show } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/solid-query";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useOrderHistory, type Order } from "@/hooks/account/useOrderHistory";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const OpenOrders = () => {
  const [loadingCancelOrders, setLoadingCancelOrders] = createSignal<
    Set<string>
  >(new Set());
  const { pool } = useCurrentPool();
  const getDbClient = useDeepBookAccessor();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const { balanceManagerAddress } = useBalanceManager();
  const orderHistoryQuery = useOrderHistory(
    () => pool().pool_name,
    () => balanceManagerAddress() ?? ""
  );

  const openOrders = createMemo(() => {
    const allOrders =
      orderHistoryQuery.data?.pages.flatMap((page) => page) || [];
    const orderMap = new Map<string, Order>();

    for (const order of allOrders) {
      const existing = orderMap.get(order.order_id);
      if (!existing || order.timestamp > existing.timestamp) {
        orderMap.set(order.order_id, order);
      }
    }

    return Array.from(orderMap.values())
      .filter(
        (order) => order.status === "Placed" || order.status === "Modified"
      )
      .filter((order) => order.remaining_quantity > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  const handleCancelOrder = async (orderId: string) => {
    setLoadingCancelOrders((prev) => new Set([...prev, orderId]));

    const tx = new Transaction();
    getDbClient().deepBook.cancelOrder(
      pool().pool_name,
      "MANAGER",
      orderId
    )(tx);

    try {
      await signAndExecuteTransaction({ transaction: tx });

      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      queryClient.invalidateQueries({ queryKey: ["managerBalance"] });

      console.log("Canceled order:", orderId);
    } catch (error) {
      console.error("Failed to cancel order:", error);

      const errorStr = String(error);
      const isOrderNotFound =
        errorStr.includes("big_vector") ||
        errorStr.includes("leaf_remove") ||
        errorStr.includes("MoveAbort");

      if (isOrderNotFound) {
        queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
        queryClient.invalidateQueries({ queryKey: ["managerBalance"] });
      }
    } finally {
      setLoadingCancelOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  return (
    <div class="relative h-full">
      <Show
        when={openOrders().length > 0}
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
            <div>No open orders</div>
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
              <TableHead class="pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody class="text-xs [&_tr]:border-none">
            <For each={openOrders()}>
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
                    {(order.original_quantity * order.price).toFixed(4)}
                  </TableCell>
                  <TableCell class="font-mono">
                    {order.order_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell class="pr-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      class="text-xs"
                      disabled={loadingCancelOrders().has(order.order_id)}
                      onClick={() => handleCancelOrder(order.order_id)}
                    >
                      {loadingCancelOrders().has(order.order_id)
                        ? "Canceling..."
                        : "Cancel"}
                    </Button>
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
