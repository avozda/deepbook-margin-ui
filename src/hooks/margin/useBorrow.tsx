import { createMutation, useQueryClient } from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useMarginManager } from "@/contexts/margin-manager";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";

export type BorrowAssetType = "base" | "quote";

export function useBorrowBase() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["borrowBase"],
    mutationFn: async (amount: number) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().deepbook.marginManager.borrowBase(
        marginManagerKey(),
        currentPoolKey,
        amount
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      toast.success("Borrow successful");
    },
    onError: (err: Error) => {
      toast.error(`Borrow failed: ${err.message}`);
    },
  }));
}

export function useBorrowQuote() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["borrowQuote"],
    mutationFn: async (amount: number) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().deepbook.marginManager.borrowQuote(
        marginManagerKey(),
        currentPoolKey,
        amount
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      toast.success("Borrow successful");
    },
    onError: (err: Error) => {
      toast.error(`Borrow failed: ${err.message}`);
    },
  }));
}

export function useRepayBase() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["repayBase"],
    mutationFn: async (amount?: number) => {
      const tx = new Transaction();
      getDbClient().deepbook.marginManager.repayBase(
        marginManagerKey(),
        amount
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      toast.success("Repayment successful");
    },
    onError: (err: Error) => {
      toast.error(`Repayment failed: ${err.message}`);
    },
  }));
}

export function useRepayQuote() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["repayQuote"],
    mutationFn: async (amount?: number) => {
      const tx = new Transaction();
      getDbClient().deepbook.marginManager.repayQuote(
        marginManagerKey(),
        amount
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      toast.success("Repayment successful");
    },
    onError: (err: Error) => {
      toast.error(`Repayment failed: ${err.message}`);
    },
  }));
}

export function useBorrow() {
  const borrowBase = useBorrowBase();
  const borrowQuote = useBorrowQuote();

  return {
    borrowBase,
    borrowQuote,
    isPending: () => borrowBase.isPending || borrowQuote.isPending,
  };
}

export function useRepay() {
  const repayBase = useRepayBase();
  const repayQuote = useRepayQuote();

  return {
    repayBase,
    repayQuote,
    isPending: () => repayBase.isPending || repayQuote.isPending,
  };
}
