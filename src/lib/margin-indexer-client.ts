import type {
  MarginManagerInfo,
  MarginManagerState,
  MarginManagerCreatedEvent,
  CollateralEvent,
  LoanBorrowedEvent,
  LoanRepaidEvent,
  LiquidationEvent,
  LiquidatablePosition,
} from "@/types/margin";

const INDEXER_URLS = {
  mainnet: "https://deepbook-indexer.mainnet.mystenlabs.com",
  testnet: "https://deepbook-indexer.testnet.mystenlabs.com",
} as const;

type Network = "mainnet" | "testnet";

export class MarginIndexerClient {
  private baseUrl: string;

  constructor(network: Network) {
    this.baseUrl = INDEXER_URLS[network];
  }

  private async fetchJson<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }

    const url = `${this.baseUrl}${endpoint}${searchParams.toString() ? `?${searchParams}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Indexer request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getMarginManagerCreated(
    marginManagerId: string
  ): Promise<MarginManagerCreatedEvent[]> {
    return this.fetchJson<MarginManagerCreatedEvent[]>(
      "/margin_manager_created",
      { margin_manager_id: marginManagerId }
    );
  }

  async getMarginManagersInfo(): Promise<MarginManagerInfo[]> {
    return this.fetchJson<MarginManagerInfo[]>("/margin_managers_info");
  }

  async getMarginManagerStates(params?: {
    maxRiskRatio?: number;
    deepbookPoolId?: string;
  }): Promise<MarginManagerState[]> {
    return this.fetchJson<MarginManagerState[]>("/margin_manager_states", {
      max_risk_ratio: params?.maxRiskRatio,
      deepbook_pool_id: params?.deepbookPoolId,
    });
  }

  async getMarginManagerState(
    marginManagerId: string
  ): Promise<MarginManagerState | null> {
    const states = await this.getMarginManagerStates();
    return states.find((s) => s.margin_manager_id === marginManagerId) ?? null;
  }

  async getLiquidatablePositions(
    poolId?: string
  ): Promise<LiquidatablePosition[]> {
    const states = await this.getMarginManagerStates({
      maxRiskRatio: 1.0,
      deepbookPoolId: poolId,
    });

    return states.map((state) => ({
      marginManagerId: state.margin_manager_id,
      poolKey: `${state.base_asset_symbol}_${state.quote_asset_symbol}`,
      riskRatio: parseFloat(state.risk_ratio),
      baseAsset: parseFloat(state.base_asset),
      quoteAsset: parseFloat(state.quote_asset),
      baseDebt: parseFloat(state.base_debt),
      quoteDebt: parseFloat(state.quote_debt),
      baseAssetSymbol: state.base_asset_symbol,
      quoteAssetSymbol: state.quote_asset_symbol,
      baseAssetType: state.base_asset_id,
      quoteAssetType: state.quote_asset_id,
    }));
  }

  async getCollateralEvents(
    marginManagerId: string,
    params?: {
      type?: "Deposit" | "Withdraw";
      isBase?: boolean;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): Promise<CollateralEvent[]> {
    return this.fetchJson<CollateralEvent[]>("/collateral_events", {
      margin_manager_id: marginManagerId,
      type: params?.type,
      is_base: params?.isBase?.toString(),
      start_time: params?.startTime,
      end_time: params?.endTime,
      limit: params?.limit,
    });
  }

  async getLoanBorrowedEvents(
    marginManagerId: string,
    params?: {
      marginPoolId?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): Promise<LoanBorrowedEvent[]> {
    return this.fetchJson<LoanBorrowedEvent[]>("/loan_borrowed", {
      margin_manager_id: marginManagerId,
      margin_pool_id: params?.marginPoolId,
      start_time: params?.startTime,
      end_time: params?.endTime,
      limit: params?.limit,
    });
  }

  async getLoanRepaidEvents(
    marginManagerId: string,
    params?: {
      marginPoolId?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): Promise<LoanRepaidEvent[]> {
    return this.fetchJson<LoanRepaidEvent[]>("/loan_repaid", {
      margin_manager_id: marginManagerId,
      margin_pool_id: params?.marginPoolId,
      start_time: params?.startTime,
      end_time: params?.endTime,
      limit: params?.limit,
    });
  }

  async getLiquidationEvents(
    marginManagerId: string,
    params?: {
      marginPoolId?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): Promise<LiquidationEvent[]> {
    return this.fetchJson<LiquidationEvent[]>("/liquidation", {
      margin_manager_id: marginManagerId,
      margin_pool_id: params?.marginPoolId,
      start_time: params?.startTime,
      end_time: params?.endTime,
      limit: params?.limit,
    });
  }
}

export function createMarginIndexerClient(
  network: Network
): MarginIndexerClient {
  return new MarginIndexerClient(network);
}
