import { createSignal, createEffect, Show } from "solid-js";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AccountSummary } from "@/components/trade/trading-panel/account-summary";
import { OrderForm } from "@/components/trade/trading-panel/order-form";
import { MarginOrderForm } from "@/components/margin/margin-order-form";
import { MarginAccountPanel } from "@/components/margin/margin-account-panel";
import { CollateralManager } from "@/components/margin/collateral-manager";
import { BorrowRepayForm } from "@/components/margin/borrow-repay-form";
import { PositionSummary } from "@/components/margin/position-summary";
import { useMarginManager } from "@/contexts/margin-manager";
import { useMarginSupport } from "@/hooks/margin";

export type PositionType = "buy" | "sell";
export type OrderExecutionType = "limit" | "market";
export type TradingMode = "spot" | "margin";

export const TradingPanel = () => {
  const [positionType, setPositionType] = createSignal<PositionType>("buy");
  const [orderType, setOrderType] = createSignal<OrderExecutionType>("limit");
  const [tradingMode, setTradingMode] = createSignal<TradingMode>("spot");
  const { hasMarginManager } = useMarginManager();
  const { isMarginSupported, unsupportedReason } = useMarginSupport();

  createEffect(() => {
    if (!isMarginSupported() && tradingMode() === "margin") {
      setTradingMode("spot");
    }
  });

  return (
    <div class="flex h-full w-full min-w-fit shrink-0 flex-col">
      <div class="flex items-center justify-between border-b px-3 py-2">
        <ToggleGroup
          variant="outline"
          value={tradingMode()}
          onChange={(value) => value && setTradingMode(value as TradingMode)}
          class="w-fit"
        >
          <ToggleGroupItem value="spot" class="px-4 text-xs">
            SPOT
          </ToggleGroupItem>
          <Show
            when={isMarginSupported()}
            fallback={
              <Tooltip>
                <TooltipTrigger
                  as={ToggleGroupItem}
                  value="margin"
                  class="px-4 text-xs"
                  disabled
                >
                  MARGIN
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

      <Show when={tradingMode() === "spot"} fallback={<MarginAccountPanel />}>
        <AccountSummary />
      </Show>

      <Show when={tradingMode() === "margin" && hasMarginManager()}>
        <div class="border-b">
          <PositionSummary />
          <div class="flex w-full justify-center gap-4 px-3 pb-3">
            <CollateralManager />
            <BorrowRepayForm />
          </div>
        </div>
      </Show>

      <div class="flex h-12 w-full">
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

      <div class="px-3 pt-3">
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
        <MarginOrderForm
          positionType={positionType()}
          orderExecutionType={orderType()}
        />
      </Show>
    </div>
  );
};
