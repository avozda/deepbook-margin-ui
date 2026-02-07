import { useMutation, useQueryClient } from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useMarginManager } from "@/contexts/margin-manager";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";

export type PlaceMarginLimitOrderParams = {
  price: number;
  quantity: number;
  isBid: boolean;
  clientOrderId?: string;
  expiration?: number;
};

export type PlaceMarginMarketOrderParams = {
  quantity: number;
  isBid: boolean;
  clientOrderId?: string;
};

export function usePlaceMarginLimitOrder() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return useMutation(() => ({
    mutationKey: ["placeMarginLimitOrder"],
    mutationFn: async (params: PlaceMarginLimitOrderParams) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();

      getDbClient().poolProxy.placeLimitOrder({
        poolKey: currentPoolKey,
        marginManagerKey: marginManagerKey(),
        clientOrderId: params.clientOrderId ?? Date.now().toString(),
        price: params.price,
        quantity: params.quantity,
        isBid: params.isBid,
        expiration: params.expiration,
        payWithDeep: true,
      })(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      toast.success("Limit order placed");
      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["marginAccountState"] }),
        queryClient.refetchQueries({ queryKey: ["healthFactor"] }),
        queryClient.refetchQueries({ queryKey: ["marginOrders"] }),
        queryClient.refetchQueries({ queryKey: ["orderUpdates"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error(`Order failed: ${err.message}`);
    },
  }));
}

export function usePlaceMarginMarketOrder() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return useMutation(() => ({
    mutationKey: ["placeMarginMarketOrder"],
    mutationFn: async (params: PlaceMarginMarketOrderParams) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().poolProxy.placeMarketOrder({
        poolKey: currentPoolKey,
        marginManagerKey: marginManagerKey(),
        clientOrderId: params.clientOrderId ?? Date.now().toString(),
        quantity: params.quantity,
        isBid: params.isBid,
        payWithDeep: true,
      })(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      queryClient.invalidateQueries({ queryKey: ["accountTradeHistory"] });
      toast.success("Market order placed");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["marginAccountState"] }),
        queryClient.refetchQueries({ queryKey: ["healthFactor"] }),
        queryClient.refetchQueries({ queryKey: ["marginOrders"] }),
        queryClient.refetchQueries({ queryKey: ["orderUpdates"] }),
        queryClient.refetchQueries({ queryKey: ["accountTradeHistory"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error(`Order failed: ${err.message}`);
    },
  }));
}

export function useCancelMarginOrder() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return useMutation(() => ({
    mutationKey: ["cancelMarginOrder"],
    mutationFn: async (orderId: string) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().poolProxy.cancelOrder(marginManagerKey(), orderId)(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      toast.success("Order cancelled");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["marginAccountState"] }),
        queryClient.refetchQueries({ queryKey: ["healthFactor"] }),
        queryClient.refetchQueries({ queryKey: ["marginOrders"] }),
        queryClient.refetchQueries({ queryKey: ["orderUpdates"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error(`Cancel failed: ${err.message}`);
    },
  }));
}

export function useCancelAllMarginOrders() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return useMutation(() => ({
    mutationKey: ["cancelAllMarginOrders"],
    mutationFn: async () => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().poolProxy.cancelAllOrders(marginManagerKey())(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      toast.success("All orders cancelled");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["marginAccountState"] }),
        queryClient.refetchQueries({ queryKey: ["healthFactor"] }),
        queryClient.refetchQueries({ queryKey: ["marginOrders"] }),
        queryClient.refetchQueries({ queryKey: ["orderUpdates"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error(`Cancel all failed: ${err.message}`);
    },
  }));
}

export function useWithdrawSettledAmounts() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey, poolKey } = useMarginManager();
  const queryClient = useQueryClient();

  return useMutation(() => ({
    mutationKey: ["withdrawSettledAmounts"],
    mutationFn: async () => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().poolProxy.withdrawSettledAmounts(marginManagerKey())(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalances"] });
      toast.success("Settled amounts withdrawn");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["marginAccountState"] }),
        queryClient.refetchQueries({ queryKey: ["healthFactor"] }),
        queryClient.refetchQueries({ queryKey: ["walletBalances"] }),
      ]);
    },
    onError: (err: Error) => {
      toast.error(`Withdrawal failed: ${err.message}`);
    },
  }));
}
