import { createSignal, createEffect, For } from "solid-js";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentPool } from "@/contexts/pool";
import { useDeepBook } from "@/contexts/deepbook";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSignAndExecuteTransaction,
} from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { useBalance, useManagerBalance } from "@/hooks/account/useBalances";
import { mainnetCoins, testnetCoins, type Coin } from "@/constants/deepbook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";

type TransferType = "deposit" | "withdraw";

export const BalanceManager = () => {
  const { pool } = useCurrentPool();
  const dbClient = useDeepBook();
  const network = useCurrentNetwork();
  const account = useCurrentAccount();
  const signAndExecuteTransaction = useSignAndExecuteTransaction();
  const { balanceManagerKey } = useBalanceManager();

  const coins = () => (network() === "mainnet" ? mainnetCoins : testnetCoins);

  const [transferType, setTransferType] = createSignal<TransferType>("deposit");
  const [selectedAsset, setSelectedAsset] = createSignal(
    pool().quote_asset_symbol
  );
  const [amount, setAmount] = createSignal<number>(0);
  const [isOpen, setIsOpen] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const selectedCoin = (): Coin | undefined => coins()[selectedAsset()];

  const { data: walletBalance } = useBalance(
    () => selectedCoin()?.type ?? "",
    () => selectedCoin()?.scalar ?? 1
  );
  const { data: managerBalance, refetch: refetchManagerBalance } =
    useManagerBalance(balanceManagerKey, selectedAsset);

  createEffect(() => {
    if (isOpen()) {
      setSelectedAsset(pool().quote_asset_symbol);
    }
  });

  const handleDeposit = async () => {
    setIsSubmitting(true);
    const tx = new Transaction();
    dbClient.balanceManager.depositIntoManager(
      balanceManagerKey(),
      selectedAsset(),
      amount()
    )(tx);

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      refetchManagerBalance();
      console.log(`Deposited ${amount()} ${selectedAsset()}:`, result);
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
    dbClient.balanceManager.withdrawFromManager(
      balanceManagerKey(),
      selectedAsset(),
      amount(),
      addr
    )(tx);

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      refetchManagerBalance();
      console.log(`Withdrew ${amount()} ${selectedAsset()}:`, result);
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

  const isValidAmount = () => {
    const amt = amount();
    if (amt <= 0) return false;
    if (transferType() === "deposit") {
      return walletBalance !== undefined && amt <= (walletBalance ?? 0);
    } else {
      return (
        managerBalance !== undefined && amt <= (managerBalance?.balance ?? 0)
      );
    }
  };

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger
        as={Button}
        class="mt-3 grow"
        variant="outline"
        onClick={() => {
          setSelectedAsset(pool().quote_asset_symbol);
          setTransferType("deposit");
        }}
      >
        Deposit
      </DialogTrigger>
      <DialogTrigger
        as={Button}
        class="mt-3 grow"
        variant="outline"
        onClick={() => {
          setSelectedAsset(pool().base_asset_symbol);
          setTransferType("withdraw");
        }}
      >
        Withdraw
      </DialogTrigger>
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
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          <TabsContent value={transferType()}>
            <form class="mt-4" onSubmit={handleSubmit}>
              <p class="text-sm">
                Wallet Balance: {walletBalance ?? 0} {selectedAsset()}
              </p>
              <p class="text-sm">
                Manager Balance: {managerBalance?.balance ?? 0}{" "}
                {selectedAsset()}
              </p>
              <div class="relative my-4">
                <TextField>
                  <TextFieldInput
                    class="[appearance:textfield] rounded-sm py-6 pr-24 text-left text-2xl shadow-none hover:border-gray-300 focus:ring-0 focus:outline-2 focus:-outline-offset-1 focus:outline-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    step="any"
                    value={amount()}
                    onInput={(e) =>
                      setAmount(parseFloat(e.currentTarget.value) || 0)
                    }
                  />
                </TextField>
                <div class="absolute top-1/2 right-2 -translate-y-1/2">
                  <select
                    class="bg-background border-input h-10 rounded-md border px-3 py-2 text-sm"
                    value={selectedAsset()}
                    onChange={(e) => setSelectedAsset(e.currentTarget.value)}
                  >
                    <For each={Object.keys(coins())}>
                      {(symbol) => <option value={symbol}>{symbol}</option>}
                    </For>
                  </select>
                </div>
              </div>
              <div class="flex w-full justify-end">
                <Button
                  type="submit"
                  disabled={!isValidAmount() || isSubmitting()}
                >
                  {isSubmitting()
                    ? "Submitting..."
                    : `${transferType() === "deposit" ? "Deposit" : "Withdraw"} ${selectedAsset()}`}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
