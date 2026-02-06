import { useMutation } from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useMarginManager } from "@/contexts/margin-manager";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@/contexts/dapp-kit";

export type BorrowAssetType = "base" | "quote";

export function useBorrowBase() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return useMutation(() => ({
    mutationKey: ["borrowBase"],
    mutationFn: async (amount: number) => {
      const tx = new Transaction();
      getDbClient().marginManager.borrowBase(marginManagerKey(), amount)(tx);

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
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return useMutation(() => ({
    mutationKey: ["borrowQuote"],
    mutationFn: async (amount: number) => {
      const tx = new Transaction();
      getDbClient().marginManager.borrowQuote(marginManagerKey(), amount)(tx);

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
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return useMutation(() => ({
    mutationKey: ["repayBase"],
    mutationFn: async (amount?: number) => {
      const tx = new Transaction();
      getDbClient().marginManager.repayBase(marginManagerKey(), amount)(tx);

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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await Promise.all([
        mutation.client.refetchQueries({ queryKey: ["marginAccountState"] }),
        mutation.client.refetchQueries({ queryKey: ["healthFactor"] }),
        mutation.client.refetchQueries({ queryKey: ["walletBalances"] }),
      ]);

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
  const suiClient = useSuiClient();
  const { marginManagerKey } = useMarginManager();

  return useMutation(() => ({
    mutationKey: ["repayQuote"],
    mutationFn: async (amount?: number) => {
      const tx = new Transaction();
      getDbClient().marginManager.repayQuote(marginManagerKey(), amount)(tx);

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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await Promise.all([
        mutation.client.refetchQueries({ queryKey: ["marginAccountState"] }),
        mutation.client.refetchQueries({ queryKey: ["healthFactor"] }),
        mutation.client.refetchQueries({ queryKey: ["walletBalances"] }),
      ]);

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
