import { Show, Suspense, Switch, Match, createSignal } from "solid-js";
import { Wallet, Check, Copy, Plus } from "lucide-solid";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import {
  useBalanceManager,
  useBalanceManagerIds,
} from "@/contexts/balance-manager";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useManagerBalance } from "@/hooks/account/useBalances";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BalanceManager } from "./balance-manager";

const BalanceManagerSelector = () => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const getDbClient = useDeepBookAccessor();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerAddress, setBalanceManager } = useBalanceManager();
  const balanceManagerIdsQuery = useBalanceManagerIds();
  const [copied, setCopied] = createSignal(false);
  const [isCreating, setIsCreating] = createSignal(false);

  const handleCopy = (e: Event) => {
    e.stopPropagation();
    const address = balanceManagerAddress();
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateBalanceManager = async () => {
    setIsCreating(true);
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
        balanceManagerIdsQuery.refetch();
      }
    } catch (error) {
      console.error("Error creating balance manager:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Show when={account()}>
      <Suspense
        fallback={
          <div class="bg-muted h-8 w-full animate-pulse rounded-md border" />
        }
      >
        <Show
          when={!balanceManagerIdsQuery.isLoading}
          fallback={
            <div class="bg-muted h-8 w-full animate-pulse rounded-md border" />
          }
        >
          <Show
            when={
              balanceManagerIdsQuery.data &&
              balanceManagerIdsQuery.data.length > 0
            }
            fallback={
              <Button
                variant="outline"
                class="w-full"
                onClick={handleCreateBalanceManager}
                disabled={isCreating()}
              >
                <Plus class="mr-2 size-3.5" />
                {isCreating() ? "Creating..." : "Create Balance Manager"}
              </Button>
            }
          >
            <div class="flex items-center gap-1">
              <Select
                class="min-w-0 flex-1 space-y-0"
                options={balanceManagerIdsQuery.data ?? []}
                optionValue={(item) => item}
                optionTextValue={(item) => truncateAddress(item)}
                value={balanceManagerAddress() ?? undefined}
                onChange={(value) => value && setBalanceManager(value)}
                placeholder="Select manager"
                sameWidth={false}
                itemComponent={(props) => (
                  <SelectItem item={props.item} class="font-mono text-xs">
                    {truncateAddress(props.item.rawValue)}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="h-8 gap-2 font-mono text-xs">
                  <Wallet class="text-muted-foreground size-3.5 shrink-0" />
                  <SelectValue<string>>
                    {(state) => truncateAddress(state.selectedOption())}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
              <Show when={balanceManagerAddress()}>
                <Tooltip>
                  <TooltipTrigger
                    as={Button}
                    variant="ghost"
                    size="icon"
                    class="size-8 shrink-0"
                    onClick={handleCopy}
                  >
                    <Show when={copied()} fallback={<Copy class="size-3.5" />}>
                      <Check class="size-3.5 text-green-500" />
                    </Show>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied() ? "Copied!" : "Copy address"}</p>
                  </TooltipContent>
                </Tooltip>
              </Show>
              <Tooltip>
                <TooltipTrigger
                  as={Button}
                  variant="ghost"
                  size="icon"
                  class="size-8 shrink-0"
                  onClick={handleCreateBalanceManager}
                  disabled={isCreating()}
                >
                  <Plus class="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create new balance manager</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </Show>
        </Show>
      </Suspense>
    </Show>
  );
};

export const AccountSummary = () => {
  const { pool, round } = useCurrentPool();
  const account = useCurrentAccount();
  const { balanceManagerAddress } = useBalanceManager();
  const baseAssetManagerBalanceQuery = useManagerBalance(
    () => pool().base_asset_symbol
  );
  const quoteAssetManagerBalanceQuery = useManagerBalance(
    () => pool().quote_asset_symbol
  );

  return (
    <div class="border-b p-3">
      <Show
        when={account()}
        fallback={
          <div class="text-muted-foreground text-sm">Connect your wallet</div>
        }
      >
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium">Balance Manager</span>
            <BalanceManagerSelector />
          </div>

          <Show when={balanceManagerAddress()}>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium">Balance Manager Funds</span>
              <Switch>
                <Match
                  when={
                    baseAssetManagerBalanceQuery.isLoading ||
                    quoteAssetManagerBalanceQuery.isLoading
                  }
                >
                  <div class="flex flex-col gap-1">
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
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};
