import { createSignal } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useDeepBookAccount } from "@/hooks/account/useDeepBookAccount";
import { useManagerBalance } from "@/hooks/account/useBalances";
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
  const account = useDeepBookAccount(pool().pool_name);
  const managerBaseBalanceQuery = useManagerBalance(
    () => pool().base_asset_symbol
  );
  const managerQuoteBalanceQuery = useManagerBalance(
    () => pool().quote_asset_symbol
  );
  const [isLoading, setIsLoading] = createSignal(false);

  const handleClaimSettledFunds = async () => {
    setIsLoading(true);

    const tx = new Transaction();
    getDbClient().deepBook.withdrawSettledAmounts(
      pool().pool_name,
      "MANAGER"
    )(tx);

    try {
      await signAndExecuteTransaction({ transaction: tx });
      console.log("Withdrew settled balances");

      managerBaseBalanceQuery.refetch();
      managerQuoteBalanceQuery.refetch();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      account.refetch();
    } catch (error) {
      console.error("Failed to withdraw settled balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSettledBalance = () => {
    const base = account.data?.settled_balances?.base ?? 0;
    const quote = account.data?.settled_balances?.quote ?? 0;
    return base > 0 || quote > 0;
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
            </TableCell>
            <TableCell>{account.data?.settled_balances?.base ?? 0}</TableCell>
            <TableCell>{account.data?.settled_balances?.quote ?? 0}</TableCell>
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
