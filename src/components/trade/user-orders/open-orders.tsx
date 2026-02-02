import { createSignal, For, Show } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBook } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useManagerBalance } from "@/hooks/account/useBalances";
import { useOpenOrders } from "@/hooks/account/useOpenOrders";
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
  const dbClient = useDeepBook();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerKey } = useBalanceManager();
  const { refetch: refetchManagerBaseBalance } = useManagerBalance(
    balanceManagerKey(),
    pool().base_asset_symbol
  );
  const { refetch: refetchManagerQuoteBalance } = useManagerBalance(
    balanceManagerKey(),
    pool().quote_asset_symbol
  );
  const orders = useOpenOrders(pool().pool_name, balanceManagerKey());

  const handleCancelOrder = async (orderId: string) => {
    setLoadingCancelOrders((prev) => new Set([...prev, orderId]));

    const tx = new Transaction();
    dbClient.deepBook.cancelOrder(
      pool().pool_name,
      balanceManagerKey(),
      orderId
    )(tx);

    try {
      await signAndExecuteTransaction({ transaction: tx });

      await new Promise((resolve) => setTimeout(resolve, 400));
      orders.refetch();
      refetchManagerBaseBalance();
      refetchManagerQuoteBalance();
      console.log("Canceled order:", orderId);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setLoadingCancelOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  return (
    <div class="relative h-full overflow-y-auto">
      <Show
        when={orders.data && orders.data.length > 0}
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
              <TableHead class="pl-4">EXPIRATION</TableHead>
              <TableHead>QUANTITY</TableHead>
              <TableHead>ID</TableHead>
              <TableHead class="pr-4 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="text-xs [&_tr]:border-none">
            <For each={orders.data}>
              {(order) => (
                <Show when={order}>
                  <TableRow>
                    <TableCell class="text-muted-foreground pl-4">
                      {new Date(
                        Number(order!.expire_timestamp) / 1000000
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>{`${order!.filled_quantity} / ${order!.quantity}`}</TableCell>
                    <TableCell class="font-mono">
                      {order!.order_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell class="pr-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        class="text-xs"
                        disabled={loadingCancelOrders().has(order!.order_id)}
                        onClick={() => handleCancelOrder(order!.order_id)}
                      >
                        {loadingCancelOrders().has(order!.order_id)
                          ? "Canceling..."
                          : "Cancel"}
                      </Button>
                    </TableCell>
                  </TableRow>
                </Show>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
    </div>
  );
};
