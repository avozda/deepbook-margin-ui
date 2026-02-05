import { createSignal, createEffect, Show, Suspense } from "solid-js";
import { useMarginManager } from "@/contexts/margin-manager";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useBalance } from "@/hooks/account/useBalances";
import {
  useMarginDeposit,
  useMarginWithdraw,
  useMarginAccountState,
  type DepositAssetType,
} from "@/hooks/margin";
import { mainnetCoins, testnetCoins } from "@/constants/deepbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
  TabsIndicator,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrementTrigger,
  NumberFieldIncrementTrigger,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type TransferType = "deposit" | "withdraw";
type AssetOption = "base" | "quote" | "deep";

const assetOptions: AssetOption[] = ["base", "quote", "deep"];

export const CollateralManager = () => {
  const network = useCurrentNetwork();
  const { hasMarginManager } = useMarginManager();
  const marginDeposit = useMarginDeposit();
  const marginWithdraw = useMarginWithdraw();
  const accountStateQuery = useMarginAccountState();

  const coins = () => (network() === "mainnet" ? mainnetCoins : testnetCoins);

  const [transferType, setTransferType] = createSignal<TransferType>("deposit");
  const [selectedAsset, setSelectedAsset] = createSignal<AssetOption>("quote");
  const [amount, setAmount] = createSignal<number>(0);
  const [isOpen, setIsOpen] = createSignal(false);

  const getAssetSymbol = (asset: AssetOption): string => {
    const state = accountStateQuery.data;
    if (asset === "base") return state?.baseAssetSymbol ?? "BASE";
    if (asset === "quote") return state?.quoteAssetSymbol ?? "QUOTE";
    return "DEEP";
  };

  const getCoinType = (asset: AssetOption): string => {
    const assetSymbol = getAssetSymbol(asset);
    return coins()[assetSymbol]?.type ?? "";
  };

  const getCoinScalar = (asset: AssetOption): number => {
    const assetSymbol = getAssetSymbol(asset);
    return coins()[assetSymbol]?.scalar ?? 1;
  };

  const walletBalanceQuery = useBalance(
    () => getCoinType(selectedAsset()),
    () => getCoinScalar(selectedAsset())
  );

  const getCollateralBalance = (asset: AssetOption): number => {
    const state = accountStateQuery.data;
    if (!state) return 0;
    if (asset === "base") return state.baseAsset;
    if (asset === "quote") return state.quoteAsset;
    return state.deepBalance ?? 0;
  };

  createEffect(() => {
    if (isOpen()) {
      walletBalanceQuery.refetch();
      accountStateQuery.refetch();
    }
  });

  const handleDeposit = async () => {
    await marginDeposit.mutateAsync({
      asset: selectedAsset() as DepositAssetType,
      amount: amount(),
    });
    setAmount(0);
    setIsOpen(false);
  };

  const handleWithdraw = async () => {
    await marginWithdraw.mutateAsync({
      asset: selectedAsset() as DepositAssetType,
      amount: amount(),
    });
    setAmount(0);
    setIsOpen(false);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (transferType() === "deposit") {
      await handleDeposit();
    } else {
      await handleWithdraw();
    }
  };

  const isValidAmount = () => {
    const amt = amount();
    if (amt <= 0) return false;
    if (transferType() === "deposit") {
      return (
        walletBalanceQuery.data !== undefined &&
        amt <= (walletBalanceQuery.data ?? 0)
      );
    } else {
      return amt <= getCollateralBalance(selectedAsset());
    }
  };

  const isSubmitting = () =>
    marginDeposit.isPending || marginWithdraw.isPending;

  return (
    <Show when={hasMarginManager()}>
      <Dialog open={isOpen()} onOpenChange={setIsOpen}>
        <Button
          class="mt-3 grow"
          variant="outline"
          onClick={() => {
            setSelectedAsset("quote");
            setTransferType("deposit");
            setIsOpen(true);
          }}
        >
          Deposit
        </Button>
        <Button
          class="mt-3 grow"
          variant="outline"
          onClick={() => {
            setSelectedAsset("base");
            setTransferType("withdraw");
            setIsOpen(true);
          }}
        >
          Withdraw
        </Button>
        <DialogContent class="w-screen max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Collateral</DialogTitle>
          </DialogHeader>
          <Tabs
            class="mt-4"
            value={transferType()}
            onChange={(value) => setTransferType(value as TransferType)}
          >
            <TabsList class="grid w-full grid-cols-2">
              <TabsIndicator />
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Asset</label>
                  <Select
                    options={assetOptions}
                    optionValue={(item) => item}
                    optionTextValue={(item) => getAssetSymbol(item)}
                    value={selectedAsset()}
                    onChange={(value) => value && setSelectedAsset(value)}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>
                        {getAssetSymbol(props.item.rawValue)}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue<AssetOption>>
                        {(state) => getAssetSymbol(state.selectedOption())}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Amount</label>
                  <NumberField
                    rawValue={amount()}
                    onRawValueChange={(value) => setAmount(value || 0)}
                    minValue={0}
                    formatOptions={{ maximumFractionDigits: 20 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger />
                      <NumberFieldInput
                        class="py-6 text-2xl shadow-none"
                        placeholder="0.00"
                      />
                      <NumberFieldIncrementTrigger />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
                <div class="bg-muted/50 space-y-1 rounded-md p-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Wallet Balance</span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!walletBalanceQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {walletBalanceQuery.data?.toFixed(4) ?? "0.0000"}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      Collateral Balance
                    </span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {getCollateralBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                </div>
                <Button
                  type="submit"
                  class="w-full"
                  disabled={!isValidAmount() || isSubmitting()}
                >
                  {isSubmitting()
                    ? "Depositing..."
                    : `Deposit ${getAssetSymbol(selectedAsset())}`}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="withdraw">
              <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Asset</label>
                  <Select
                    options={assetOptions}
                    optionValue={(item) => item}
                    optionTextValue={(item) => getAssetSymbol(item)}
                    value={selectedAsset()}
                    onChange={(value) => value && setSelectedAsset(value)}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>
                        {getAssetSymbol(props.item.rawValue)}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue<AssetOption>>
                        {(state) => getAssetSymbol(state.selectedOption())}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Amount</label>
                  <NumberField
                    rawValue={amount()}
                    onRawValueChange={(value) => setAmount(value || 0)}
                    minValue={0}
                    formatOptions={{ maximumFractionDigits: 20 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger />
                      <NumberFieldInput
                        class="py-6 text-2xl shadow-none"
                        placeholder="0.00"
                      />
                      <NumberFieldIncrementTrigger />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
                <div class="bg-muted/50 space-y-1 rounded-md p-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      Collateral Balance
                    </span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {getCollateralBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Wallet Balance</span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!walletBalanceQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {walletBalanceQuery.data?.toFixed(4) ?? "0.0000"}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                </div>
                <p class="text-muted-foreground text-xs">
                  Note: Withdrawals may be restricted if it would reduce your
                  health factor below the minimum threshold.
                </p>
                <Button
                  type="submit"
                  class="w-full"
                  disabled={!isValidAmount() || isSubmitting()}
                >
                  {isSubmitting()
                    ? "Withdrawing..."
                    : `Withdraw ${getAssetSymbol(selectedAsset())}`}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Show>
  );
};
