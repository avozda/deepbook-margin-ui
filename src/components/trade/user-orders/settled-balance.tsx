import { createSignal } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBook } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useDeepBookAccount } from "@/hooks/account/useDeepBookAccount";
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
  const dbClient = useDeepBook();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerKey } = useBalanceManager();
  const account = useDeepBookAccount(pool().pool_name, balanceManagerKey());
  const [isLoading, setIsLoading] = createSignal(false);

  const handleClaimSettledFunds = async () => {
    setIsLoading(true);

    const tx = new Transaction();
    dbClient.deepBook.withdrawSettledAmounts(
      pool().pool_name,
      balanceManagerKey()
    )(tx);

    try {
      await signAndExecuteTransaction({ transaction: tx });
      console.log("Withdrew settled balances");
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
    <div class="relative h-full overflow-y-auto">
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
