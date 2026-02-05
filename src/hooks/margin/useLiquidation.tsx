import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { MarginIndexerClient } from "@/lib/margin-indexer-client";
import type { LiquidatablePosition } from "@/types/margin";

export function useLiquidatablePositions(poolId?: () => string | undefined) {
  const network = useCurrentNetwork();

  return createQuery(() => ({
    queryKey: ["liquidatablePositions", network(), poolId?.()],
    queryFn: async (): Promise<LiquidatablePosition[]> => {
      const indexer = new MarginIndexerClient(network());
      return indexer.getLiquidatablePositions(poolId?.());
    },
    refetchInterval: 30000,
    staleTime: 15000,
  }));
}

export type LiquidateParams = {
  managerAddress: string;
  poolKey: string;
  debtIsBase: boolean;
  repayAmount: number;
  coinType: string;
  coinScalar: number;
};

export function useLiquidate() {
  const getDbClient = useDeepBookAccessor();
  const signAndExecute = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationKey: ["liquidate"],
    mutationFn: async (params: LiquidateParams) => {
      const tx = new Transaction();

      const repayAmountRaw = Math.floor(params.repayAmount * params.coinScalar);
      const repayCoin = tx.splitCoins(tx.gas, [tx.pure.u64(repayAmountRaw)]);

      getDbClient().deepbook.marginManager.liquidate(
        params.managerAddress,
        params.poolKey,
        params.debtIsBase,
        repayCoin
      )(tx);

      const result = await signAndExecute({ transaction: tx });
      if (result.$kind !== "Transaction") {
        throw new Error("Transaction failed");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liquidatablePositions"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalances"] });
      queryClient.invalidateQueries({ queryKey: ["marginAccountState"] });
      toast.success("Liquidation successful");
    },
    onError: (err: Error) => {
      toast.error(`Liquidation failed: ${err.message}`);
    },
  }));
}
