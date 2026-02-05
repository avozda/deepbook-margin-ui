import { Show, Suspense, createSignal } from "solid-js";
import { Wallet, Check, Copy, Plus } from "lucide-solid";
import { Transaction } from "@mysten/sui/transactions";
import { ConnectButton } from "@/components/header/connect-button";
import { Settings } from "@/components/header/settings";
import { PairTableTrigger } from "@/components/header/pair-table";
import { MarketStats } from "@/components/header/market-stats";
import {
  useBalanceManager,
  useBalanceManagerIds,
} from "@/contexts/balance-manager";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { truncateAddress } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";

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
          <div class="bg-muted h-8 w-32 animate-pulse rounded-md border" />
        }
      >
        <Show
          when={!balanceManagerIdsQuery.isLoading}
          fallback={
            <div class="bg-muted h-8 w-32 animate-pulse rounded-md border" />
          }
        >
          <Show
            when={
              balanceManagerIdsQuery.data &&
              balanceManagerIdsQuery.data.length > 0
            }
            fallback={
              <Tooltip>
                <TooltipTrigger
                  as={Button}
                  variant="outline"
                  size="sm"
                  class="h-8 gap-2"
                  onClick={handleCreateBalanceManager}
                  disabled={isCreating()}
                >
                  <Plus class="size-3.5" />
                  <span class="hidden sm:inline">
                    {isCreating() ? "Creating..." : "Create Manager"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a balance manager to start trading</p>
                </TooltipContent>
              </Tooltip>
            }
          >
            <div class="flex items-center gap-1">
              <Select
                class="space-y-0"
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
                <SelectTrigger class="h-8 w-[140px] gap-2 font-mono text-xs">
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
                    class="size-8"
                    onClick={handleCopy}
                  >
                    <Show when={copied()} fallback={<Copy class="size-3.5" />}>
                      <Check class="size-3.5 text-green-500" />
                    </Show>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export Balance Manager</p>
                  </TooltipContent>
                </Tooltip>
              </Show>
            </div>
          </Show>
        </Show>
      </Suspense>
    </Show>
  );
};

export const Nav = () => {
  return (
    <div class="flex w-full items-center justify-between border-b p-4">
      <div class="flex items-center gap-4 md:gap-8">
        <PairTableTrigger />
        <Suspense>
          <MarketStats />
        </Suspense>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <BalanceManagerSelector />
        <ConnectButton connectText="Connect" />
        <Settings />
      </div>
    </div>
  );
};
