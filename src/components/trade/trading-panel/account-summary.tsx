import { Show, Switch, Match } from "solid-js";
import { useCurrentPool } from "@/contexts/pool";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import {
  useBalancesFromCurrentPool,
  useManagerBalance,
} from "@/hooks/account/useBalances";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { BalanceManager } from "./balance-manager";

export const AccountSummary = () => {
  const { pool, round } = useCurrentPool();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const getDbClient = useDeepBookAccessor();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerAddress, setBalanceManager } = useBalanceManager();
  const {
    baseAssetBalance,
    quoteAssetBalance,
    isLoading: isWalletBalanceLoading,
  } = useBalancesFromCurrentPool();
  const baseAssetManagerBalanceQuery = useManagerBalance(
    () => pool().base_asset_symbol
  );
  const quoteAssetManagerBalanceQuery = useManagerBalance(
    () => pool().quote_asset_symbol
  );

  const handleCreateBalanceManager = async () => {
    const tx = new Transaction();
    getDbClient().balanceManager.createAndShareBalanceManager()(tx);
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
        (change: any) => change.type === "created"
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
      <Switch>
        <Match when={isWalletBalanceLoading()}>
          <div class="flex flex-col gap-2 pb-4">
            <div class="bg-muted h-5 w-full animate-pulse rounded" />
            <div class="bg-muted h-5 w-full animate-pulse rounded" />
          </div>
        </Match>
        <Match when={true}>
          <div class="flex justify-between text-sm">
            <div>{pool().base_asset_symbol}</div>
            <div class="text-right">{round.display(baseAssetBalance())}</div>
          </div>
          <div class="flex justify-between pb-4 text-sm">
            <div>{pool().quote_asset_symbol}</div>
            <div class="text-right">{round.display(quoteAssetBalance())}</div>
          </div>
        </Match>
      </Switch>

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
          <Switch>
            <Match
              when={
                baseAssetManagerBalanceQuery.isLoading ||
                quoteAssetManagerBalanceQuery.isLoading
              }
            >
              <div class="flex flex-col gap-2">
                <div class="bg-muted h-5 w-full animate-pulse rounded" />
                <div class="bg-muted h-5 w-full animate-pulse rounded" />
              </div>
            </Match>
            <Match when={true}>
              <div class="flex justify-between text-sm">
                <div>{pool().base_asset_symbol}</div>
                <div class="text-right">
                  {round.display(
                    baseAssetManagerBalanceQuery.data?.balance ?? 0
                  )}
                </div>
              </div>
              <div class="flex justify-between text-sm">
                <div>{pool().quote_asset_symbol}</div>
                <div class="text-right">
                  {round.display(
                    quoteAssetManagerBalanceQuery.data?.balance ?? 0
                  )}
                </div>
              </div>
            </Match>
          </Switch>
          <div class="flex w-full justify-center gap-4">
            <BalanceManager />
          </div>
        </Show>
      </Show>
    </div>
  );
};
