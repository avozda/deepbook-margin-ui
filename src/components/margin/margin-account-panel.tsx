import { Show, createEffect } from "solid-js";
import { useCurrentAccount } from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";
import { useMarginManager } from "@/contexts/margin-manager";
import { useHealthFactor, useMarginAccountState } from "@/hooks/margin";
import { useCreateMarginManager } from "@/hooks/margin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthFactorBar } from "./health-factor-bar";
import { truncateAddress } from "@/lib/utils";

export const MarginAccountPanel = () => {
  const account = useCurrentAccount();
  const { pool } = useCurrentPool();
  const { hasMarginManager, marginManagerAddress, setCurrentPoolKey } =
    useMarginManager();
  const healthFactorQuery = useHealthFactor();
  const accountStateQuery = useMarginAccountState();
  const createMarginManager = useCreateMarginManager();

  createEffect(() => {
    const poolName = pool().pool_name;
    if (poolName) {
      setCurrentPoolKey(poolName);
    }
  });

  const handleCreateMarginManager = async () => {
    await createMarginManager.mutateAsync(pool().pool_name);
  };

  return (
    <div class="flex flex-col gap-3 p-3">
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
                to start margin trading on this pool.
              </p>
              <Button
                class="w-full"
                onClick={handleCreateMarginManager}
                disabled={createMarginManager.isPending}
              >
                {createMarginManager.isPending
                  ? "Creating..."
                  : `Create Margin Account for ${pool().base_asset_symbol}/${pool().quote_asset_symbol}`}
              </Button>
            </div>
          }
        >
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Margin Account</span>
              <span class="text-muted-foreground text-xs">
                {truncateAddress(marginManagerAddress() ?? "")}
              </span>
            </div>

            <Show
              when={!healthFactorQuery.isLoading}
              fallback={<Skeleton class="h-10 w-full" />}
            >
              <HealthFactorBar
                riskRatio={healthFactorQuery.data?.riskRatio ?? Infinity}
                status={healthFactorQuery.data?.status ?? "safe"}
                isLoading={healthFactorQuery.isLoading}
              />
            </Show>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-muted/30 rounded-md p-2">
                <div class="text-muted-foreground">Base Collateral</div>
                <Show
                  when={!accountStateQuery.isLoading}
                  fallback={<Skeleton class="mt-1 h-4 w-16" />}
                >
                  <div class="font-medium">
                    {accountStateQuery.data?.baseAsset.toFixed(4) ?? "0.0000"}{" "}
                    {pool().base_asset_symbol}
                  </div>
                </Show>
              </div>
              <div class="bg-muted/30 rounded-md p-2">
                <div class="text-muted-foreground">Quote Collateral</div>
                <Show
                  when={!accountStateQuery.isLoading}
                  fallback={<Skeleton class="mt-1 h-4 w-16" />}
                >
                  <div class="font-medium">
                    {accountStateQuery.data?.quoteAsset.toFixed(4) ?? "0.0000"}{" "}
                    {pool().quote_asset_symbol}
                  </div>
                </Show>
              </div>
              <div class="bg-muted/30 rounded-md p-2">
                <div class="text-muted-foreground">Base Debt</div>
                <Show
                  when={!accountStateQuery.isLoading}
                  fallback={<Skeleton class="mt-1 h-4 w-16" />}
                >
                  <div class="font-medium text-red-500">
                    {accountStateQuery.data?.baseDebt.toFixed(4) ?? "0.0000"}{" "}
                    {pool().base_asset_symbol}
                  </div>
                </Show>
              </div>
              <div class="bg-muted/30 rounded-md p-2">
                <div class="text-muted-foreground">Quote Debt</div>
                <Show
                  when={!accountStateQuery.isLoading}
                  fallback={<Skeleton class="mt-1 h-4 w-16" />}
                >
                  <div class="font-medium text-red-500">
                    {accountStateQuery.data?.quoteDebt.toFixed(4) ?? "0.0000"}{" "}
                    {pool().quote_asset_symbol}
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
};
