import { createSignal } from "solid-js";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AccountSummary } from "@/components/trade/trading-panel/account-summary";
import { OrderForm } from "@/components/trade/trading-panel/order-form";

export type PositionType = "buy" | "sell";
export type OrderExecutionType = "limit" | "market";

export const TradingPanel = () => {
  const [positionType, setPositionType] = createSignal<PositionType>("buy");
  const [orderType, setOrderType] = createSignal<OrderExecutionType>("limit");

  return (
    <div class="flex h-full w-full min-w-fit shrink-0 flex-col">
      <AccountSummary />

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

      <OrderForm
        positionType={positionType()}
        orderExecutionType={orderType()}
      />
    </div>
  );
};
