import { useQuery, useMutation } from "@tanstack/solid-query";
import { Transaction } from "@mysten/sui/transactions";
import { coinWithBalance } from "@mysten/sui/transactions";
import { toast } from "somoto";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useSignAndExecuteTransaction } from "@/contexts/dapp-kit";
import { MarginIndexerClient } from "@/lib/margin-indexer-client";
import type { LiquidatablePosition } from "@/types/margin";

export function useLiquidatablePositions(poolId?: () => string | undefined) {
  const network = useCurrentNetwork();

  return useQuery(() => ({
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

  return useMutation(() => ({
    mutationKey: ["liquidate"],
    mutationFn: async (params: LiquidateParams) => {
      const tx = new Transaction();

      const repayCoin = coinWithBalance({
        type: params.coinType,
        balance: Math.floor(params.repayAmount * params.coinScalar),
      });

      getDbClient().marginManager.liquidate(
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
    onSuccess: (_data, _variables, _context, mutation) => {
      mutation.client.invalidateQueries({
        queryKey: ["liquidatablePositions"],
      });
      mutation.client.invalidateQueries({ queryKey: ["walletBalances"] });
      mutation.client.invalidateQueries({ queryKey: ["marginAccountState"] });
      toast.success("Liquidation successful");
    },
    onError: (err: Error) => {
      toast.error(`Liquidation failed: ${err.message}`);
    },
  }));
}
