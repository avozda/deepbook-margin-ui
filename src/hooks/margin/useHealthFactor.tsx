import { createQuery } from "@tanstack/solid-query";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useMarginManager } from "@/contexts/margin-manager";
import { MarginIndexerClient } from "@/lib/margin-indexer-client";
import { RISK_THRESHOLDS, type HealthStatus } from "@/types/margin";

export type HealthFactorData = {
  riskRatio: number;
  status: HealthStatus;
  thresholds: typeof RISK_THRESHOLDS;
  baseAsset: number;
  quoteAsset: number;
  baseDebt: number;
  quoteDebt: number;
};

function calculateHealthStatus(riskRatio: number): HealthStatus {
  if (riskRatio <= RISK_THRESHOLDS.liquidation) {
    return "liquidatable";
  }
  if (riskRatio <= RISK_THRESHOLDS.warning) {
    return "warning";
  }
  return "safe";
}

export function useHealthFactor() {
  const network = useCurrentNetwork();
  const { marginManagerAddress, hasMarginManager } = useMarginManager();

  return createQuery(() => ({
    queryKey: ["healthFactor", network(), marginManagerAddress()],
    queryFn: async (): Promise<HealthFactorData> => {
      const managerId = marginManagerAddress();
      if (!managerId) {
        return {
          riskRatio: Infinity,
          status: "safe",
          thresholds: RISK_THRESHOLDS,
          baseAsset: 0,
          quoteAsset: 0,
          baseDebt: 0,
          quoteDebt: 0,
        };
      }

      const indexer = new MarginIndexerClient(network());
      const state = await indexer.getMarginManagerState(managerId);

      if (!state) {
        return {
          riskRatio: Infinity,
          status: "safe",
          thresholds: RISK_THRESHOLDS,
          baseAsset: 0,
          quoteAsset: 0,
          baseDebt: 0,
          quoteDebt: 0,
        };
      }

      const riskRatio = parseFloat(state.risk_ratio) || Infinity;
      const status = calculateHealthStatus(riskRatio);

      return {
        riskRatio,
        status,
        thresholds: RISK_THRESHOLDS,
        baseAsset: parseFloat(state.base_asset) || 0,
        quoteAsset: parseFloat(state.quote_asset) || 0,
        baseDebt: parseFloat(state.base_debt) || 0,
        quoteDebt: parseFloat(state.quote_debt) || 0,
      };
    },
    enabled: hasMarginManager(),
    refetchInterval: 10000,
    staleTime: 0,
  }));
}

export function useMarginAccountState() {
  const network = useCurrentNetwork();
  const { marginManagerAddress, hasMarginManager } = useMarginManager();

  return createQuery(() => ({
    queryKey: ["marginAccountState", network(), marginManagerAddress()],
    queryFn: async () => {
      const managerId = marginManagerAddress();
      if (!managerId) {
        return null;
      }

      const indexer = new MarginIndexerClient(network());
      const state = await indexer.getMarginManagerState(managerId);

      if (!state) {
        return null;
      }

      const riskRatio = parseFloat(state.risk_ratio) || Infinity;

      return {
        marginManagerId: state.margin_manager_id,
        poolKey: `${state.base_asset_symbol}_${state.quote_asset_symbol}`,
        baseAsset: parseFloat(state.base_asset) || 0,
        quoteAsset: parseFloat(state.quote_asset) || 0,
        deepBalance: 0,
        baseDebt: parseFloat(state.base_debt) || 0,
        quoteDebt: parseFloat(state.quote_debt) || 0,
        baseDebtShares: 0,
        quoteDebtShares: 0,
        riskRatio,
        healthStatus: calculateHealthStatus(riskRatio),
        baseAssetSymbol: state.base_asset_symbol,
        quoteAssetSymbol: state.quote_asset_symbol,
      };
    },
    enabled: hasMarginManager(),
    refetchInterval: 10000,
    staleTime: 0,
  }));
}
