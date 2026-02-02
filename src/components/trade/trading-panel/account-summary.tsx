import { Show } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useDeepBook } from "@/contexts/deepbook";
import {
  useBalancesFromCurrentPool,
  useManagerBalance,
} from "@/hooks/account/useBalances";
import { Transaction } from "@mysten/sui/transactions";
import { mainnetPackageIds, testnetPackageIds } from "@/constants/deepbook";
import { Button } from "@/components/ui/button";
import { BalanceManager } from "./balance-manager";

export const AccountSummary = () => {
  const { pool, round } = useCurrentPool();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const dbClient = useDeepBook();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerKey, balanceManagerAddress, setBalanceManager } =
    useBalanceManager();
  const { baseAssetBalance, quoteAssetBalance } = useBalancesFromCurrentPool();
  const baseAssetManagerBalanceQuery = useManagerBalance(
    balanceManagerKey(),
    pool().base_asset_symbol
  );
  const quoteAssetManagerBalanceQuery = useManagerBalance(
    balanceManagerKey(),
    pool().quote_asset_symbol
  );

  const handleCreateBalanceManager = async () => {
    const tx = new Transaction();
    dbClient.balanceManager.createAndShareBalanceManager()(tx);

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      if (result.$kind !== "Transaction") {
        console.error("Transaction failed:", result);
        return;
      }

      const txResult = await suiClient().waitForTransaction({
        digest: result.Transaction.digest,
        options: {
          showObjectChanges: true,
        },
      });

      const managerAddress: string | undefined = txResult.objectChanges?.find(
        (change: any) => {
          return (
            change.type === "created" &&
            (change.objectType ===
              `${mainnetPackageIds.DEEPBOOK_PACKAGE_ID}::balance_manager::BalanceManager` ||
              change.objectType ===
                `${testnetPackageIds.DEEPBOOK_PACKAGE_ID}::balance_manager::BalanceManager`)
          );
        }
      )?.["objectId"];

      if (managerAddress) {
        setBalanceManager(managerAddress);
      }
    } catch (error) {
      console.error("Error creating balance manager:", error);
    }
  };

  return (
    <div class="border-b p-3">
      <h1 class="pb-2 text-sm font-medium">Available to trade</h1>
      <div class="flex justify-between text-sm">
        <div>{pool().base_asset_symbol}</div>
        <div class="text-right">{round.display(baseAssetBalance)}</div>
      </div>
      <div class="flex justify-between pb-4 text-sm">
        <div>{pool().quote_asset_symbol}</div>
        <div class="text-right">{round.display(quoteAssetBalance)}</div>
      </div>

      <Show
        when={account()}
        fallback={
          <div class="text-muted-foreground text-sm">Connect your wallet</div>
        }
      >
        <Show
          when={balanceManagerAddress()}
          fallback={
            <Button
              variant="outline"
              class="w-full"
              onClick={handleCreateBalanceManager}
            >
              Create a balance manager
            </Button>
          }
        >
          <h1 class="pb-2 text-sm font-medium">Balance Manager Funds</h1>
          <div class="flex justify-between text-sm">
            <div>{pool().base_asset_symbol}</div>
            <div class="text-right">
              {round.display(baseAssetManagerBalanceQuery.data?.balance ?? 0)}
            </div>
          </div>
          <div class="flex justify-between text-sm">
            <div>{pool().quote_asset_symbol}</div>
            <div class="text-right">
              {round.display(quoteAssetManagerBalanceQuery.data?.balance ?? 0)}
            </div>
          </div>
          <div class="flex w-full justify-center gap-4">
            <BalanceManager />
          </div>
        </Show>
      </Show>
    </div>
  );
};
