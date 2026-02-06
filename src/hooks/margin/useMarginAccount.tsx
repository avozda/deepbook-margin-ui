import { createMutation } from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useMarginManager } from "@/contexts/margin-manager";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@/contexts/dapp-kit";

export function useCreateMarginManager() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { setMarginManager } = useMarginManager();

  return createMutation(() => ({
    mutationKey: ["createMarginManager"],
    mutationFn: async (poolKey: string) => {
      const tx = new Transaction();
      getDbClient().marginManager.newMarginManager(poolKey)(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      const txResult = await suiClient().waitForTransaction({
        digest: result.Transaction.digest,
        options: { showObjectChanges: true },
      });

      const marginManagerId = txResult.objectChanges?.find(
        (change: any) =>
          change.type === "created" &&
          change.objectType?.includes("MarginManager")
      )?.["objectId"];

      if (!marginManagerId) {
        throw new Error("Failed to find margin manager in transaction result");
      }

      setMarginManager(marginManagerId, poolKey);
      return marginManagerId;
    },
    onSuccess: () => {
      toast.success("Margin manager created successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to create margin manager: ${err.message}`);
    },
  }));
}

export type DepositAssetType = "base" | "quote" | "deep";

export function useMarginDeposit() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return createMutation(() => ({
    mutationKey: ["marginDeposit"],
    mutationFn: async (params: { asset: DepositAssetType; amount: number }) => {
      const tx = new Transaction();
      const managerKey = marginManagerKey();

      if (params.asset === "base") {
        getDbClient().marginManager.depositBase({
          managerKey,
          amount: params.amount,
        })(tx);
      } else if (params.asset === "quote") {
        getDbClient().marginManager.depositQuote({
          managerKey,
          amount: params.amount,
        })(tx);
      } else {
        getDbClient().marginManager.depositDeep({
          managerKey,
          amount: params.amount,
        })(tx);
      }

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      await suiClient().waitForTransaction({
        digest: result.Transaction.digest,
      });

      return result;
    },
    onSuccess: async (_data, _variables, _context, mutation) => {
      mutation.client.invalidateQueries({ queryKey: ["marginAccountState"] });
      mutation.client.invalidateQueries({ queryKey: ["healthFactor"] });
      mutation.client.invalidateQueries({ queryKey: ["walletBalances"] });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        mutation.client.refetchQueries({ queryKey: ["marginAccountState"] }),
        mutation.client.refetchQueries({ queryKey: ["healthFactor"] }),
        mutation.client.refetchQueries({ queryKey: ["walletBalances"] }),
      ]);

      toast.success("Deposit successful");
    },
    onError: (err: Error) => {
      toast.error(`Deposit failed: ${err.message}`);
    },
  }));
}

export type WithdrawAssetType = "base" | "quote" | "deep";

export function useMarginWithdraw() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return createMutation(() => ({
    mutationKey: ["marginWithdraw"],
    mutationFn: async (params: {
      asset: WithdrawAssetType;
      amount: number;
    }) => {
      const tx = new Transaction();
      const managerKey = marginManagerKey();

      if (params.asset === "base") {
        getDbClient().marginManager.withdrawBase(managerKey, params.amount)(tx);
      } else if (params.asset === "quote") {
        getDbClient().marginManager.withdrawQuote(
          managerKey,
          params.amount
        )(tx);
      } else {
        getDbClient().marginManager.withdrawDeep(managerKey, params.amount)(tx);
      }

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      await suiClient().waitForTransaction({
        digest: result.Transaction.digest,
      });

      return result;
    },
    onSuccess: async (_data, _variables, _context, mutation) => {
      mutation.client.invalidateQueries({ queryKey: ["marginAccountState"] });
      mutation.client.invalidateQueries({ queryKey: ["healthFactor"] });
      mutation.client.invalidateQueries({ queryKey: ["walletBalances"] });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        mutation.client.refetchQueries({ queryKey: ["marginAccountState"] }),
        mutation.client.refetchQueries({ queryKey: ["healthFactor"] }),
        mutation.client.refetchQueries({ queryKey: ["walletBalances"] }),
      ]);

      toast.success("Withdrawal successful");
    },
    onError: (err: Error) => {
      toast.error(`Withdrawal failed: ${err.message}`);
    },
  }));
}
