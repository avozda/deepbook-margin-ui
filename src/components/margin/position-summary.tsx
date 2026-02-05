import { Show, createMemo } from "solid-js";
import { useMarginManager } from "@/contexts/margin-manager";
import { useMarginAccountState, useHealthFactor } from "@/hooks/margin";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthFactorBar, HealthFactorBadge } from "./health-factor-bar";

export const PositionSummary = () => {
  const { hasMarginManager } = useMarginManager();
  const accountStateQuery = useMarginAccountState();
  const healthFactorQuery = useHealthFactor();

  const netPosition = createMemo(() => {
    const state = accountStateQuery.data;
    if (!state) return { base: 0, quote: 0 };
    return {
      base: state.baseAsset - state.baseDebt,
      quote: state.quoteAsset - state.quoteDebt,
    };
  });

  const hasDebt = createMemo(() => {
    const state = accountStateQuery.data;
    if (!state) return false;
    return state.baseDebt > 0 || state.quoteDebt > 0;
  });

  return (
    <Show
      when={hasMarginManager()}
      fallback={
        <div class="text-muted-foreground p-3 text-center text-sm">
          No margin account
        </div>
      }
    >
      <div class="flex flex-col gap-3 p-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Position Summary</span>
          <Show when={!healthFactorQuery.isLoading}>
            <HealthFactorBadge
              status={healthFactorQuery.data?.status ?? "safe"}
            />
          </Show>
        </div>

        <Show
          when={!accountStateQuery.isLoading}
          fallback={
            <div class="space-y-2">
              <Skeleton class="h-16 w-full" />
              <Skeleton class="h-16 w-full" />
            </div>
          }
        >
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/30 rounded-md p-3">
              <div class="text-muted-foreground text-xs">
                {accountStateQuery.data?.baseAssetSymbol ?? "BASE"}
              </div>
              <div class="mt-1 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-muted-foreground">Collateral</span>
                  <span class="text-green-500">
                    +{accountStateQuery.data?.baseAsset.toFixed(4) ?? "0.0000"}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-muted-foreground">Debt</span>
                  <span class="text-red-500">
                    -{accountStateQuery.data?.baseDebt.toFixed(4) ?? "0.0000"}
                  </span>
                </div>
                <div class="border-t pt-1">
                  <div class="flex justify-between text-xs font-medium">
                    <span>Net</span>
                    <span
                      class={
                        netPosition().base >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {netPosition().base >= 0 ? "+" : ""}
                      {netPosition().base.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-muted/30 rounded-md p-3">
              <div class="text-muted-foreground text-xs">
                {accountStateQuery.data?.quoteAssetSymbol ?? "QUOTE"}
              </div>
              <div class="mt-1 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-muted-foreground">Collateral</span>
                  <span class="text-green-500">
                    +{accountStateQuery.data?.quoteAsset.toFixed(4) ?? "0.0000"}
                  </span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-muted-foreground">Debt</span>
                  <span class="text-red-500">
                    -{accountStateQuery.data?.quoteDebt.toFixed(4) ?? "0.0000"}
                  </span>
                </div>
                <div class="border-t pt-1">
                  <div class="flex justify-between text-xs font-medium">
                    <span>Net</span>
                    <span
                      class={
                        netPosition().quote >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {netPosition().quote >= 0 ? "+" : ""}
                      {netPosition().quote.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Show when={hasDebt()}>
            <HealthFactorBar
              riskRatio={healthFactorQuery.data?.riskRatio ?? Infinity}
              status={healthFactorQuery.data?.status ?? "safe"}
              isLoading={healthFactorQuery.isLoading}
            />
          </Show>

          <Show when={!hasDebt()}>
            <div class="bg-muted/30 rounded-md p-2 text-center text-xs">
              <span class="text-muted-foreground">
                No active loans - borrow to start margin trading
              </span>
            </div>
          </Show>
        </Show>
      </div>
    </Show>
  );
};
