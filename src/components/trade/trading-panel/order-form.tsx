import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBook } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useManagerBalance } from "@/hooks/account/useBalances";
import { useOpenOrders } from "@/hooks/account/useOpenOrders";
import { useOrderbook } from "@/hooks/market/useOrderbook";
import { Button } from "@/components/ui/button";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field";
import type { PositionType, OrderExecutionType } from "./trading-panel";

type OrderFormProps = {
  positionType: PositionType;
  orderExecutionType: OrderExecutionType;
};

export const OrderForm = (props: OrderFormProps) => {
  const { pool, round } = useCurrentPool();
  const dbClient = useDeepBook();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerKey, balanceManagerAddress } = useBalanceManager();
  const orderbookQuery = useOrderbook();
  const { data: managerBaseAssetBalance, refetch: refetchManagerBaseBalance } =
    useManagerBalance(balanceManagerKey(), pool().base_asset_symbol);
  const {
    data: managerQuoteAssetBalance,
    refetch: refetchManagerQuoteBalance,
  } = useManagerBalance(balanceManagerKey(), pool().quote_asset_symbol);
  const { refetch: refetchOpenOrders } = useOpenOrders(
    pool().pool_name,
    balanceManagerKey()
  );

  const [limitPrice, setLimitPrice] = createSignal<number | undefined>();
  const [amount, setAmount] = createSignal<number | undefined>();
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  let limitPriceFilled = false;

  const balanceManagerBalance = createMemo(() => ({
    baseAsset: managerBaseAssetBalance?.balance ?? 0,
    quoteAsset: managerQuoteAssetBalance?.balance ?? 0,
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
      if (props.orderExecutionType === "limit") {
        if (!price) return;
        dbClient.deepBook.placeLimitOrder({
          poolKey: pool().pool_name,
          balanceManagerKey: balanceManagerKey(),
          clientOrderId: Date.now().toString(),
          price: price,
          quantity: amt,
          isBid: props.positionType === "buy",
        })(tx);
      } else {
        dbClient.deepBook.placeMarketOrder({
          poolKey: pool().pool_name,
          balanceManagerKey: balanceManagerKey(),
          clientOrderId: Date.now().toString(),
          quantity: amt,
          isBid: props.positionType === "buy",
        })(tx);
      }

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await new Promise((resolve) => setTimeout(resolve, 400));
      refetchOpenOrders();
      refetchManagerBaseBalance();
      refetchManagerQuoteBalance();
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

    if (props.positionType === "buy") {
      const totalValue = (price ?? 0) * amt;
      if (totalValue > balanceManagerBalance().quoteAsset) return false;
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
          <TextField class="relative">
            <TextFieldLabel class="absolute top-2 left-2 text-xs">
              LIMIT
            </TextFieldLabel>
            <TextFieldLabel class="absolute top-2 right-2 text-xs">
              {pool().quote_asset_symbol}
            </TextFieldLabel>
            <TextFieldInput
              class="h-8 [appearance:textfield] rounded-sm pr-14 text-right shadow-none hover:border-gray-300 focus:ring-0 focus:outline-2 focus:-outline-offset-1 focus:outline-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              placeholder="0.0000"
              step="any"
              disabled={!balanceManagerAddress()}
              value={limitPrice() ?? ""}
              onInput={(e) =>
                setLimitPrice(parseFloat(e.currentTarget.value) || undefined)
              }
              onBlur={() => {
                const val = limitPrice();
                if (val) setLimitPrice(Number(round.quote(val)));
              }}
            />
            <div class="mt-1 flex gap-1">
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
          </TextField>
        </Show>

        <TextField class="relative">
          <TextFieldLabel class="absolute top-2 left-2 text-xs">
            AMOUNT
          </TextFieldLabel>
          <TextFieldLabel class="absolute top-2 right-2 text-xs">
            {pool().base_asset_symbol}
          </TextFieldLabel>
          <TextFieldInput
            class="h-8 [appearance:textfield] rounded-sm pr-14 text-right shadow-none hover:border-gray-300 focus:ring-0 focus:outline-2 focus:-outline-offset-1 focus:outline-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            type="number"
            placeholder="0.0000"
            step="any"
            disabled={!balanceManagerAddress()}
            value={amount() ?? ""}
            onInput={(e) =>
              setAmount(parseFloat(e.currentTarget.value) || undefined)
            }
            onBlur={() => {
              const val = amount();
              if (val) setAmount(Number(round.base(val)));
            }}
          />
          <div class="mt-1 flex gap-1">
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
        </TextField>
      </form>

      <div class="flex h-full flex-col gap-3 border-t p-3 text-xs">
        <div class="flex flex-col gap-1">
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
