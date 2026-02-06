import { createSignal, createEffect, Show, Suspense, lazy } from "solid-js";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountSummary } from "@/components/trade/trading-panel/account-summary";
import { OrderForm } from "@/components/trade/trading-panel/order-form";
import { useMarginManager } from "@/contexts/margin-manager";
import { useTradingMode } from "@/contexts/trading-mode";
import { useMarginSupport } from "@/hooks/margin";

const MarginAccountPanel = lazy(
  () => import("@/components/margin/margin-account-panel")
);
const MarginOrderForm = lazy(
  () => import("@/components/margin/margin-order-form")
);
const MarginActions = lazy(() => import("@/components/margin/margin-actions"));

const MarginPanelSkeleton = () => (
  <div class="flex flex-col gap-3 border-b p-3">
    <Skeleton class="h-5 w-32" />
    <Skeleton class="h-8 w-full" />
    <Skeleton class="h-8 w-full" />
  </div>
);

export type PositionType = "buy" | "sell";
export type OrderExecutionType = "limit" | "market";

export const TradingPanel = () => {
  const [positionType, setPositionType] = createSignal<PositionType>("buy");
  const [orderType, setOrderType] = createSignal<OrderExecutionType>("limit");
  const { tradingMode, setTradingMode } = useTradingMode();
  const { hasMarginManager } = useMarginManager();
  const { isMarginSupported, unsupportedReason } = useMarginSupport();

  createEffect(() => {
    if (!isMarginSupported() && tradingMode() === "margin") {
      setTradingMode("spot");
    }
  });

  return (
    <div class="flex h-full w-full min-w-0 flex-col overflow-hidden">
      <div class="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <ToggleGroup
          variant="outline"
          value={tradingMode()}
          onChange={(value) =>
            value && setTradingMode(value as "spot" | "margin")
          }
          class="w-fit"
        >
          <ToggleGroupItem value="spot" class="px-4 text-xs">
            SPOT
          </ToggleGroupItem>
          <Show
            when={isMarginSupported()}
            fallback={
              <Tooltip>
                <TooltipTrigger as="span" class="inline-flex">
                  <ToggleGroupItem
                    value="margin"
                    class="pointer-events-none px-4 text-xs"
                    disabled
                  >
                    MARGIN
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{unsupportedReason()}</TooltipContent>
              </Tooltip>
            }
          >
            <ToggleGroupItem value="margin" class="px-4 text-xs">
              MARGIN
            </ToggleGroupItem>
          </Show>
        </ToggleGroup>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <Show
          when={tradingMode() === "spot"}
          fallback={
            <Suspense fallback={<MarginPanelSkeleton />}>
              <MarginAccountPanel />
            </Suspense>
          }
        >
          <AccountSummary />
        </Show>

        <Show when={tradingMode() === "margin" && hasMarginManager()}>
          <Suspense fallback={<MarginPanelSkeleton />}>
            <div class="border-b">
              <MarginActions />
            </div>
          </Suspense>
        </Show>

        <Show when={tradingMode() === "spot" || hasMarginManager()}>
          <div class="flex h-12 w-full shrink-0">
            <button
              class={`flex-1 text-sm font-medium transition-colors ${
                positionType() === "buy"
                  ? "border-b-2 border-[#26a69a] bg-[#26a69a]/10 text-[#26a69a]"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              onClick={() => setPositionType("buy")}
            >
              Buy
            </button>
            <button
              class={`flex-1 text-sm font-medium transition-colors ${
                positionType() === "sell"
                  ? "border-b-2 border-[#ef5350] bg-[#ef5350]/10 text-[#ef5350]"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              onClick={() => setPositionType("sell")}
            >
              Sell
            </button>
          </div>

          <div class="shrink-0 px-3 pt-3">
            <ToggleGroup
              variant="outline"
              value={orderType()}
              onChange={(value) =>
                value && setOrderType(value as OrderExecutionType)
              }
              class="w-fit"
            >
              <ToggleGroupItem value="limit" class="px-4 text-xs">
                LIMIT
              </ToggleGroupItem>
              <ToggleGroupItem value="market" class="px-4 text-xs">
                MARKET
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Show
            when={tradingMode() === "margin"}
            fallback={
              <OrderForm
                positionType={positionType()}
                orderExecutionType={orderType()}
              />
            }
          >
            <Suspense fallback={<MarginPanelSkeleton />}>
              <MarginOrderForm
                positionType={positionType()}
                orderExecutionType={orderType()}
              />
            </Suspense>
          </Show>
        </Show>
      </div>
    </div>
  );
};
