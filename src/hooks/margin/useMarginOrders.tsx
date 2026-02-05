import { createMutation, useQueryClient } from "@tanstack/solid-query";
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

  return createMutation(() => ({
    mutationKey: ["placeMarginLimitOrder"],
    mutationFn: async (params: PlaceMarginLimitOrderParams) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().deepbook.poolProxy.placeLimitOrder({
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

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      toast.success("Limit order placed");
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

  return createMutation(() => ({
    mutationKey: ["placeMarginMarketOrder"],
    mutationFn: async (params: PlaceMarginMarketOrderParams) => {
      const currentPoolKey = poolKey();
      if (!currentPoolKey) {
        throw new Error("No margin manager pool configured");
      }

      const tx = new Transaction();
      getDbClient().deepbook.poolProxy.placeMarketOrder({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      queryClient.invalidateQueries({ queryKey: ["healthFactor"] });
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      queryClient.invalidateQueries({ queryKey: ["accountTradeHistory"] });
      toast.success("Market order placed");
    },
    onError: (err: Error) => {
      toast.error(`Order failed: ${err.message}`);
    },
  }));
}

export function useCancelMarginOrder() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["cancelMarginOrder"],
    mutationFn: async (orderId: string) => {
      const tx = new Transaction();
      getDbClient().deepbook.poolProxy.cancelOrder(
        marginManagerKey(),
        orderId
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      toast.success("Order cancelled");
    },
    onError: (err: Error) => {
      toast.error(`Cancel failed: ${err.message}`);
    },
  }));
}

export function useCancelAllMarginOrders() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["cancelAllMarginOrders"],
    mutationFn: async () => {
      const tx = new Transaction();
      getDbClient().deepbook.poolProxy.cancelAllOrders(marginManagerKey())(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marginOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderUpdates"] });
      toast.success("All orders cancelled");
    },
    onError: (err: Error) => {
      toast.error(`Cancel all failed: ${err.message}`);
    },
  }));
}

export function useWithdrawSettledAmounts() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const { marginManagerKey } = useMarginManager();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["withdrawSettledAmounts"],
    mutationFn: async () => {
      const tx = new Transaction();
      getDbClient().deepbook.poolProxy.withdrawSettledAmounts(
        marginManagerKey()
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
      toast.success("Settled amounts withdrawn");
    },
    onError: (err: Error) => {
      toast.error(`Withdrawal failed: ${err.message}`);
    },
  }));
}
