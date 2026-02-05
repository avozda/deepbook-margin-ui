import { createMutation, useQueryClient } from "@tanstack/solid-query";
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
      tx.add(getDbClient().deepbook.marginManager.newMarginManager(poolKey));

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
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["marginDeposit"],
    mutationFn: async (params: { asset: DepositAssetType; amount: number }) => {
      const tx = new Transaction();
      const managerKey = marginManagerKey();

      if (params.asset === "base") {
        getDbClient().deepbook.marginManager.depositBase(
          managerKey,
          params.amount
        )(tx);
      } else if (params.asset === "quote") {
        getDbClient().deepbook.marginManager.depositQuote(
          managerKey,
          params.amount
        )(tx);
      } else {
        getDbClient().deepbook.marginManager.depositDeep(
          managerKey,
          params.amount
        )(tx);
      }

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalances"] });
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
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["marginWithdraw"],
    mutationFn: async (params: {
      asset: WithdrawAssetType;
      amount: number;
    }) => {
      const tx = new Transaction();
      const managerKey = marginManagerKey();

      if (params.asset === "base") {
        getDbClient().deepbook.marginManager.withdrawBase(
          managerKey,
          params.amount
        )(tx);
      } else if (params.asset === "quote") {
        getDbClient().deepbook.marginManager.withdrawQuote(
          managerKey,
          params.amount
        )(tx);
      } else {
        getDbClient().deepbook.marginManager.withdrawDeep(
          managerKey,
          params.amount
        )(tx);
      }

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalances"] });
      toast.success("Withdrawal successful");
    },
    onError: (err: Error) => {
      toast.error(`Withdrawal failed: ${err.message}`);
    },
  }));
}
