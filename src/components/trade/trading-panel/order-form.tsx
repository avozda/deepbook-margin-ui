import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/solid-query";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useManagerBalance } from "@/hooks/account/useBalances";
import { useOrderbook } from "@/hooks/market/useOrderbook";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import type { PositionType, OrderExecutionType } from "./trading-panel";

type OrderFormProps = {
  positionType: PositionType;
  orderExecutionType: OrderExecutionType;
};

export const OrderForm = (props: OrderFormProps) => {
  const { pool, round } = useCurrentPool();
  const getDbClient = useDeepBookAccessor();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const { balanceManagerAddress } = useBalanceManager();
  const orderbookQuery = useOrderbook();
  const managerBaseAssetBalanceQuery = useManagerBalance(
    () => pool().base_asset_symbol
  );
  const managerQuoteAssetBalanceQuery = useManagerBalance(
    () => pool().quote_asset_symbol
  );

  const [limitPrice, setLimitPrice] = createSignal<number | undefined>();
  const [amount, setAmount] = createSignal<number | undefined>();
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  let limitPriceFilled = false;

  const balanceManagerBalance = createMemo(() => ({
    baseAsset: managerBaseAssetBalanceQuery.data?.balance ?? 0,
    quoteAsset: managerQuoteAssetBalanceQuery.data?.balance ?? 0,
  }));

  const bestBid = createMemo(() => orderbookQuery.data?.bids[0]?.price);
  const bestAsk = createMemo(() => orderbookQuery.data?.asks[0]?.price);
  const midPrice = createMemo(() => {
    const bid = bestBid();
    const ask = bestAsk();
    if (bid && ask) return (bid + ask) / 2;
    return undefined;
  });

  const total = createMemo(() => {
    const price = limitPrice();
    const amt = amount();
    if (price && amt) return price * amt;
    return undefined;
  });

  createEffect(() => {
    const mid = midPrice();
    if (!limitPriceFilled && mid) {
      setLimitPrice(Number(round.quote(mid)));
      limitPriceFilled = true;
    }
  });

  const updateLimitPrice = (type: "mid" | "bid") => {
    if (type === "mid" && midPrice()) {
      setLimitPrice(Number(round.quote(midPrice()!)));
    } else if (bestBid()) {
      setLimitPrice(Number(round.quote(bestBid()!)));
    }
  };

  const updateAmount = (percent: 0.25 | 0.5 | 1) => {
    const price = limitPrice();
    if (!price) return;

    if (props.positionType === "buy") {
      const newAmount =
        ((percent * balanceManagerBalance().quoteAsset) / price) * 0.99;
      const integerAmount = newAmount * 10 ** pool().base_asset_decimals;
      const rounded =
        Math.floor(integerAmount / pool().lot_size) * pool().lot_size;
      setAmount(rounded / 10 ** pool().base_asset_decimals);
    } else {
      setAmount(percent * balanceManagerBalance().baseAsset);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const price = limitPrice();
    const amt = amount();
    if (!amt) return;

    setIsSubmitting(true);
    const tx = new Transaction();

    try {
      const dbClient = getDbClient();
      if (props.orderExecutionType === "limit") {
        if (!price) return;
        dbClient.deepBook.placeLimitOrder({
          poolKey: pool().pool_name,
          balanceManagerKey: "MANAGER",
          clientOrderId: Date.now().toString(),
          price: price,
          quantity: amt,
          isBid: props.positionType === "buy",
        })(tx);
      } else {
        dbClient.deepBook.placeMarketOrder({
          poolKey: pool().pool_name,
          balanceManagerKey: "MANAGER",
          clientOrderId: Date.now().toString(),
          quantity: amt,
          isBid: props.positionType === "buy",
        })(tx);
      }

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      queryClient.invalidateQueries({ queryKey: ["accountTradeHistory"] });
      queryClient.invalidateQueries({ queryKey: ["managerBalance"] });

      console.log(`Placed ${props.orderExecutionType} order:`, result);
    } catch (error) {
      console.error(`Error placing ${props.orderExecutionType} order:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = createMemo(() => {
    const amt = amount();
    const price = limitPrice();
    if (!amt || amt <= 0) return false;
    if (props.orderExecutionType === "limit" && (!price || price <= 0))
      return false;

    const minSize = pool().min_size / 10 ** pool().base_asset_decimals;
    if (amt < minSize) return false;

    if (props.positionType === "buy") {
      if (props.orderExecutionType === "limit") {
        const totalValue = price! * amt;
        if (totalValue > balanceManagerBalance().quoteAsset) return false;
      }
    } else {
      if (amt > balanceManagerBalance().baseAsset) return false;
    }

    return true;
  });

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        id="order"
        class="flex flex-col gap-3 px-3 py-3"
      >
        <Show when={props.orderExecutionType === "limit"}>
          <NumberField
            rawValue={limitPrice()}
            onRawValueChange={(value) => setLimitPrice(value || undefined)}
            minValue={0}
            formatOptions={{ maximumFractionDigits: 20 }}
            disabled={!balanceManagerAddress()}
          >
            <NumberFieldGroup class="relative">
              <NumberFieldLabel class="absolute top-2 left-2 text-xs">
                LIMIT
              </NumberFieldLabel>
              <NumberFieldLabel class="absolute top-2 right-2 text-xs">
                {pool().quote_asset_symbol}
              </NumberFieldLabel>
              <NumberFieldInput
                class="h-8 rounded-sm pr-14 text-right shadow-none hover:border-gray-300 focus:ring-0 focus:outline-2 focus:-outline-offset-1 focus:outline-gray-400"
                placeholder="0.0000"
                onBlur={() => {
                  const val = limitPrice();
                  if (val) setLimitPrice(Number(round.quote(val)));
                }}
              />
            </NumberFieldGroup>
            <div class="flex gap-1">
              <Button
                disabled={!balanceManagerAddress()}
                class="h-8 rounded-sm hover:border-gray-300"
                variant="outline"
                type="button"
                onClick={() => updateLimitPrice("mid")}
              >
                MID
              </Button>
              <Button
                disabled={!balanceManagerAddress()}
                class="h-8 rounded-sm hover:border-gray-300"
                variant="outline"
                type="button"
                onClick={() => updateLimitPrice("bid")}
              >
                BID
              </Button>
            </div>
          </NumberField>
        </Show>

        <NumberField
          rawValue={amount()}
          onRawValueChange={(value) => setAmount(value || undefined)}
          minValue={0}
          formatOptions={{ maximumFractionDigits: 20 }}
          disabled={!balanceManagerAddress()}
        >
          <NumberFieldGroup class="relative">
            <NumberFieldLabel class="absolute top-2 left-2 text-xs">
              AMOUNT
            </NumberFieldLabel>
            <NumberFieldLabel class="absolute top-2 right-2 text-xs">
              {pool().base_asset_symbol}
            </NumberFieldLabel>
            <NumberFieldInput
              class="h-8 rounded-sm pr-14 text-right shadow-none hover:border-gray-300 focus:ring-0 focus:outline-2 focus:-outline-offset-1 focus:outline-gray-400"
              placeholder="0.0000"
              onBlur={() => {
                const val = amount();
                if (val) setAmount(Number(round.base(val)));
              }}
            />
          </NumberFieldGroup>
          <div class="flex gap-1">
            <Button
              disabled={!balanceManagerAddress()}
              class="h-8 w-1/3 rounded-sm hover:border-gray-300"
              variant="outline"
              type="button"
              onClick={() => updateAmount(0.25)}
            >
              25%
            </Button>
            <Button
              disabled={!balanceManagerAddress()}
              class="h-8 w-1/3 rounded-sm hover:border-gray-300"
              variant="outline"
              type="button"
              onClick={() => updateAmount(0.5)}
            >
              50%
            </Button>
            <Button
              disabled={!balanceManagerAddress()}
              class="h-8 w-1/3 rounded-sm hover:border-gray-300"
              variant="outline"
              type="button"
              onClick={() => updateAmount(1.0)}
            >
              MAX
            </Button>
          </div>
        </NumberField>
      </form>

      <div class="flex h-full flex-col gap-3 border-t p-3 text-xs">
        <div class="flex flex-col gap-1">
          <div class="text-muted-foreground flex justify-between">
            <div>MIN SIZE</div>
            <div>
              {pool().min_size / 10 ** pool().base_asset_decimals}{" "}
              {pool().base_asset_symbol}
            </div>
          </div>
          <div class="text-muted-foreground flex justify-between">
            <div>TOTAL</div>
            <div>
              {total()
                ? `${round.quote(total()!)} ${pool().quote_asset_symbol}`
                : "--"}
            </div>
          </div>
          <div class="text-muted-foreground flex justify-between">
            <div>FEE</div>
            <div>--</div>
          </div>
        </div>

        <Button
          class={`w-full ${props.positionType === "buy" ? "bg-[#26a69a] hover:bg-[#26a69a]/90" : "bg-[#ef5350] hover:bg-[#ef5350]/90"}`}
          type="submit"
          form="order"
          disabled={!balanceManagerAddress() || !isValid() || isSubmitting()}
        >
          {isSubmitting()
            ? "Submitting..."
            : `${props.positionType === "buy" ? "Buy" : "Sell"} ${pool().base_asset_symbol}`}
        </Button>
      </div>
    </div>
  );
};
