import { createSignal, createMemo } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/solid-query";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useMarginManager } from "@/contexts/margin-manager";
import { useTradingMode } from "@/contexts/trading-mode";
import { useDeepBookAccount } from "@/hooks/account/useDeepBookAccount";
import { useManagerBalance } from "@/hooks/account/useBalances";
import { useMarginBalanceManagerId } from "@/hooks/margin/useMarginBalanceManagerId";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const SettledBalance = () => {
  const { pool } = useCurrentPool();
  const getDbClient = useDeepBookAccessor();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const { marginManagerKey, hasMarginManager } = useMarginManager();
  const { tradingMode } = useTradingMode();
  const marginBmQuery = useMarginBalanceManagerId();

  const spotAccount = useDeepBookAccount(pool().pool_name);
  const managerBaseBalanceQuery = useManagerBalance(
    () => pool().base_asset_symbol
  );
  const managerQuoteBalanceQuery = useManagerBalance(
    () => pool().quote_asset_symbol
  );
  const [isLoading, setIsLoading] = createSignal(false);

  const isMarginMode = createMemo(
    () => tradingMode() === "margin" && hasMarginManager()
  );

  const settledBase = createMemo(() => {
    return spotAccount.data?.settled_balances?.base ?? 0;
  });

  const settledQuote = createMemo(() => {
    return spotAccount.data?.settled_balances?.quote ?? 0;
  });

  const handleClaimSettledFunds = async () => {
    setIsLoading(true);

    const tx = new Transaction();

    if (isMarginMode()) {
      getDbClient().poolProxy.withdrawSettledAmounts(marginManagerKey())(tx);
    } else {
      getDbClient().deepBook.withdrawSettledAmounts(
        pool().pool_name,
        "MANAGER"
      )(tx);
    }

    try {
      await signAndExecuteTransaction({ transaction: tx });

      managerBaseBalanceQuery.refetch();
      managerQuoteBalanceQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      spotAccount.refetch();
    } catch (error) {
      console.error("Failed to withdraw settled balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSettledBalance = () => {
    return settledBase() > 0 || settledQuote() > 0;
  };

  return (
    <div class="relative h-full">
      <Table>
        <TableHeader class="bg-background text-muted-foreground sticky top-0 text-xs [&_tr]:border-none">
          <TableRow>
            <TableHead class="pl-4">PAIR</TableHead>
            <TableHead>BASE ({pool().base_asset_symbol})</TableHead>
            <TableHead>QUOTE ({pool().quote_asset_symbol})</TableHead>
            <TableHead class="pr-4 text-right">ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="text-xs [&_tr]:border-none">
          <TableRow>
            <TableCell class="text-muted-foreground pl-4">
              {pool().pool_name}
              {isMarginMode() && (
                <span class="text-muted-foreground ml-1">(Margin)</span>
              )}
            </TableCell>
            <TableCell>{settledBase()}</TableCell>
            <TableCell>{settledQuote()}</TableCell>
            <TableCell class="pr-4 text-right">
              <Button
                variant="outline"
                size="sm"
                class="text-xs"
                disabled={isLoading() || !hasSettledBalance()}
                onClick={handleClaimSettledFunds}
              >
                {isLoading() ? "Claiming..." : "Claim"}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
