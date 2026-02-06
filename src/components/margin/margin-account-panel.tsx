import { Show, createEffect, createMemo, createSignal, For } from "solid-js";
import { Copy, Check } from "lucide-solid";
import { useCurrentAccount } from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";
import { useMarginManager } from "@/contexts/margin-manager";
import { useHealthFactor, useMarginAccountState } from "@/hooks/margin";
import { useCreateMarginManager } from "@/hooks/margin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthFactorBar } from "./health-factor-bar";
import { truncateAddress } from "@/lib/utils";

const MarginAccountPanel = () => {
  const account = useCurrentAccount();
  const { pool } = useCurrentPool();
  const { hasMarginManager, marginManagerAddress, setCurrentPoolKey } =
    useMarginManager();
  const healthFactorQuery = useHealthFactor();
  const accountStateQuery = useMarginAccountState();
  const createMarginManager = useCreateMarginManager();
  const [copied, setCopied] = createSignal(false);

  const handleCopyAddress = async () => {
    const address = marginManagerAddress();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  createEffect(() => {
    const poolName = pool().pool_name;
    if (poolName) {
      setCurrentPoolKey(poolName);
    }
  });

  const handleCreateMarginManager = async () => {
    await createMarginManager.mutateAsync(pool().pool_name);
  };

  const balanceRows = createMemo(() => {
    const state = accountStateQuery.data;
    const p = pool();
    if (!state) return [];

    return [
      {
        label: p.base_asset_symbol ?? "BASE",
        collateral: state.baseAsset,
        debt: state.baseDebt,
        net: state.baseAsset - state.baseDebt,
      },
      {
        label: p.quote_asset_symbol ?? "QUOTE",
        collateral: state.quoteAsset,
        debt: state.quoteDebt,
        net: state.quoteAsset - state.quoteDebt,
      },
    ];
  });

  return (
    <div class="flex min-w-0 flex-col gap-2 overflow-hidden border-b p-3">
      <Show
        when={account()}
        fallback={
          <div class="text-muted-foreground py-4 text-center text-sm">
            Connect wallet to use margin trading
          </div>
        }
      >
        <Show
          when={hasMarginManager()}
          fallback={
            <div class="flex flex-col gap-3">
              <div class="text-sm font-medium">Create Margin Account</div>
              <p class="text-muted-foreground text-xs">
                Create a margin account for{" "}
                <span class="font-medium">
                  {pool().base_asset_symbol}/{pool().quote_asset_symbol}
                </span>{" "}
                to start margin trading.
              </p>
              <Button
                class="w-full"
                onClick={handleCreateMarginManager}
                disabled={createMarginManager.isPending}
              >
                {createMarginManager.isPending
                  ? "Creating..."
                  : "Create Margin Account"}
              </Button>
            </div>
          }
        >
          <div class="flex min-w-0 flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Margin Account</span>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                onClick={handleCopyAddress}
                title={copied() ? "Copied!" : "Copy address"}
              >
                <span>{truncateAddress(marginManagerAddress() ?? "")}</span>
                <Show when={copied()} fallback={<Copy class="size-3" />}>
                  <Check class="size-3 text-green-500" />
                </Show>
              </button>
            </div>

            <Show
              when={!healthFactorQuery.isLoading}
              fallback={<Skeleton class="h-6 w-full" />}
            >
              <HealthFactorBar
                riskRatio={healthFactorQuery.data?.riskRatio ?? Infinity}
                status={healthFactorQuery.data?.status ?? "safe"}
                isLoading={healthFactorQuery.isLoading}
              />
            </Show>

            <Show
              when={!accountStateQuery.isLoading}
              fallback={
                <div class="space-y-2">
                  <Skeleton class="h-8 w-full" />
                  <Skeleton class="h-8 w-full" />
                </div>
              }
            >
              <div class="overflow-hidden rounded-md border text-xs">
                <div class="bg-muted/50 text-muted-foreground grid grid-cols-4 gap-1 px-2 py-1.5">
                  <span>Asset</span>
                  <span class="text-right">Collateral</span>
                  <span class="text-right">Debt</span>
                  <span class="text-right">Net</span>
                </div>
                <For each={balanceRows()}>
                  {(row) => (
                    <div class="grid grid-cols-4 gap-1 border-t px-2 py-1.5">
                      <span class="truncate font-medium">{row.label}</span>
                      <span class="text-right text-green-500">
                        {row.collateral.toFixed(2)}
                      </span>
                      <span class="text-right text-red-500">
                        {row.debt.toFixed(2)}
                      </span>
                      <span
                        class={`text-right font-medium ${row.net >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {row.net >= 0 ? "+" : ""}
                        {row.net.toFixed(2)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default MarginAccountPanel;
