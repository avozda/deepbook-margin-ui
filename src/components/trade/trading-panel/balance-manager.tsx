import {
  createSignal,
  createEffect,
  createMemo,
  Show,
  Suspense,
} from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/solid-query";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import { useBalance, useManagerBalance } from "@/hooks/account/useBalances";
import { mainnetCoins, testnetCoins, type Coin } from "@/constants/deepbook";
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

type TransferType = "deposit" | "withdraw";

export const BalanceManager = () => {
  const { pool } = useCurrentPool();
  const getDbClient = useDeepBookAccessor();
  const network = useCurrentNetwork();
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const coins = () => (network() === "mainnet" ? mainnetCoins : testnetCoins);

  const [transferType, setTransferType] = createSignal<TransferType>("deposit");
  const [selectedAsset, setSelectedAsset] = createSignal(
    pool().quote_asset_symbol
  );
  const [amount, setAmount] = createSignal<number>(0);
  const [isOpen, setIsOpen] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const selectedCoin = (): Coin | undefined => coins()[selectedAsset()];

  const walletBalanceQuery = useBalance(
    () => selectedCoin()?.type ?? "",
    () => selectedCoin()?.scalar ?? 1
  );
  const managerBalanceQuery = useManagerBalance(selectedAsset);

  createEffect(() => {
    const currentPool = pool();
    setSelectedAsset(currentPool.quote_asset_symbol);
  });

  createEffect(() => {
    if (isOpen()) {
      walletBalanceQuery.refetch();
      managerBalanceQuery.refetch();
      setAmount(0);
    }
  });

  createEffect(() => {
    transferType();
    if (isOpen()) {
      setAmount(0);
    }
  });

  createEffect(() => {
    if (isOpen()) {
      const currentAmount = amount();
      const max = maxAmount();
      if (currentAmount > max) {
        setAmount(max);
      }
    }
  });

  const refetchAllBalances = () => {
    queryClient.invalidateQueries({ queryKey: ["walletBalances"] });
    queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    queryClient.invalidateQueries({ queryKey: ["managerBalance"] });
  };

  const handleDeposit = async () => {
    setIsSubmitting(true);
    const tx = new Transaction();

    getDbClient().balanceManager.depositIntoManager(
      "MANAGER",
      selectedAsset(),
      amount()
    )(tx);

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log(`Deposited ${amount()} ${selectedAsset()}:`, result);
      refetchAllBalances();
    } catch (error) {
      console.error("Error depositing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const addr = account()?.address;
    if (!addr) return;

    setIsSubmitting(true);
    const tx = new Transaction();
    getDbClient().balanceManager.withdrawFromManager(
      "MANAGER",
      selectedAsset(),
      amount(),
      addr
    )(tx);

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log(`Withdrew ${amount()} ${selectedAsset()}:`, result);
      refetchAllBalances();
    } catch (error) {
      console.error("Error withdrawing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (transferType() === "deposit") {
      await handleDeposit();
    } else {
      await handleWithdraw();
    }
  };

  const maxAmount = createMemo(() => {
    if (transferType() === "deposit") {
      return walletBalanceQuery.data ?? 0;
    } else {
      return managerBalanceQuery.data?.balance ?? 0;
    }
  });

  const isValidAmount = () => {
    const amt = amount();
    if (amt <= 0) return false;
    return amt <= maxAmount();
  };

  const handleAmountChange = (value: number | null) => {
    const newValue = value || 0;
    const max = maxAmount();
    setAmount(Math.min(newValue, max));
  };

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <Button
        class="mt-3 grow"
        variant="outline"
        onClick={() => {
          setSelectedAsset(pool().quote_asset_symbol);
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
          setSelectedAsset(pool().base_asset_symbol);
          setTransferType("withdraw");
          setIsOpen(true);
        }}
      >
        Withdraw
      </Button>
      <DialogContent class="w-screen max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Balance</DialogTitle>
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
                  options={Object.keys(coins())}
                  optionValue={(item) => item}
                  optionTextValue={(item) => item}
                  value={selectedAsset()}
                  onChange={(value) => value && setSelectedAsset(value)}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {props.item.rawValue}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-full">
                    <SelectValue<string>>
                      {(state) => state.selectedOption()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Amount</label>
                <NumberField
                  rawValue={amount()}
                  onRawValueChange={handleAmountChange}
                  minValue={0}
                  maxValue={maxAmount()}
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
                  <Suspense
                    fallback={
                      <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                    }
                  >
                    <Show
                      when={!walletBalanceQuery.isLoading}
                      fallback={
                        <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                      }
                    >
                      <span>
                        {walletBalanceQuery.data ?? 0} {selectedAsset()}
                      </span>
                    </Show>
                  </Suspense>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Manager Balance</span>
                  <Suspense
                    fallback={
                      <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                    }
                  >
                    <Show
                      when={!managerBalanceQuery.isLoading}
                      fallback={
                        <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                      }
                    >
                      <span>
                        {managerBalanceQuery.data?.balance ?? 0}{" "}
                        {selectedAsset()}
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
                  : `Deposit ${selectedAsset()}`}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="withdraw">
            <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div class="space-y-2">
                <label class="text-sm font-medium">Asset</label>
                <Select
                  options={Object.keys(coins())}
                  optionValue={(item) => item}
                  optionTextValue={(item) => item}
                  value={selectedAsset()}
                  onChange={(value) => value && setSelectedAsset(value)}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {props.item.rawValue}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-full">
                    <SelectValue<string>>
                      {(state) => state.selectedOption()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Amount</label>
                <NumberField
                  rawValue={amount()}
                  onRawValueChange={handleAmountChange}
                  minValue={0}
                  maxValue={maxAmount()}
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
                  <span class="text-muted-foreground">Manager Balance</span>
                  <Suspense
                    fallback={
                      <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                    }
                  >
                    <Show
                      when={!managerBalanceQuery.isLoading}
                      fallback={
                        <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                      }
                    >
                      <span>
                        {managerBalanceQuery.data?.balance ?? 0}{" "}
                        {selectedAsset()}
                      </span>
                    </Show>
                  </Suspense>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Wallet Balance</span>
                  <Suspense
                    fallback={
                      <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                    }
                  >
                    <Show
                      when={!walletBalanceQuery.isLoading}
                      fallback={
                        <div class="bg-muted h-4 w-16 animate-pulse rounded" />
                      }
                    >
                      <span>
                        {walletBalanceQuery.data ?? 0} {selectedAsset()}
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
                  ? "Withdrawing..."
                  : `Withdraw ${selectedAsset()}`}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
