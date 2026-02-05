export type HealthStatus = "safe" | "warning" | "liquidatable";

export type MarginAccountState = {
  marginManagerId: string;
  poolKey: string;
  baseAsset: number;
  quoteAsset: number;
  deepBalance: number;
  baseDebt: number;
  quoteDebt: number;
  baseDebtShares: number;
  quoteDebtShares: number;
  riskRatio: number;
  healthStatus: HealthStatus;
};

export type RiskParameters = {
  minWithdrawRiskRatio: number;
  minBorrowRiskRatio: number;
  liquidationRiskRatio: number;
  targetLiquidationRiskRatio: number;
  userLiquidationReward: number;
  poolLiquidationReward: number;
};

export type MarginManagerInfo = {
  margin_manager_id: string;
  deepbook_pool_id: string;
  base_asset_id: string;
  base_asset_symbol: string;
  quote_asset_id: string;
  quote_asset_symbol: string;
  base_margin_pool_id: string;
  quote_margin_pool_id: string;
};

export type MarginManagerState = {
  id: number;
  margin_manager_id: string;
  deepbook_pool_id: string;
  base_margin_pool_id: string;
  quote_margin_pool_id: string;
  base_asset_id: string;
  base_asset_symbol: string;
  quote_asset_id: string;
  quote_asset_symbol: string;
  risk_ratio: string;
  base_asset: string;
  quote_asset: string;
  base_debt: string;
  quote_debt: string;
  base_pyth_price: number;
  base_pyth_decimals: number;
  quote_pyth_price: number;
  quote_pyth_decimals: number;
  created_at: string;
  updated_at: string;
  current_price: string;
  lowest_trigger_above_price: string | null;
  highest_trigger_below_price: string | null;
};

export type LiquidatablePosition = {
  marginManagerId: string;
  poolKey: string;
  riskRatio: number;
  baseAsset: number;
  quoteAsset: number;
  baseDebt: number;
  quoteDebt: number;
  baseAssetSymbol: string;
  quoteAssetSymbol: string;
  baseAssetType: string;
  quoteAssetType: string;
};

export type CollateralEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  package: string;
  event_type: "Deposit" | "Withdraw";
  margin_manager_id: string;
  amount: string;
  asset_type: string;
  pyth_decimals: number;
  pyth_price: string;
  onchain_timestamp: number;
};

export type LoanBorrowedEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  package: string;
  margin_manager_id: string;
  margin_pool_id: string;
  loan_amount: number;
  loan_shares: number;
  onchain_timestamp: number;
};

export type LoanRepaidEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  package: string;
  margin_manager_id: string;
  margin_pool_id: string;
  repay_amount: number;
  repay_shares: number;
  onchain_timestamp: number;
};

export type LiquidationEvent = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number;
  checkpoint_timestamp_ms: number;
  package: string;
  margin_manager_id: string;
  margin_pool_id: string;
  liquidation_amount: number;
  pool_reward: number;
  pool_default: number;
  risk_ratio: number;
  onchain_timestamp: number;
  remaining_base_asset: string;
  remaining_quote_asset: string;
  remaining_base_debt: string;
  remaining_quote_debt: string;
  base_pyth_price: number;
  base_pyth_decimals: number;
  quote_pyth_price: number;
  quote_pyth_decimals: number;
};

export type MarginPoolInfo = {
  poolKey: string;
  label: string;
  baseAsset: string;
  quoteAsset: string;
};

export const RISK_THRESHOLDS = {
  liquidation: 1.0,
  warning: 1.15,
  withdrawMin: 1.2,
  borrowMin: 1.1,
} as const;
