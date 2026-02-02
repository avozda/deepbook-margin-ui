import {
  Suspense,
  Show,
  createMemo,
  createEffect,
  type ParentProps,
} from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Nav } from "@/components/header/nav";
import { PairTable, useSelectedPair } from "@/components/header/pair-table";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PoolProvider } from "@/contexts/pool";
import { usePools } from "@/hooks/market/usePools";

const DEFAULT_POOL_ID =
  "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce";

export default function AppLayout(props: ParentProps) {
  const navigate = useNavigate();
  const params = useParams<{ poolId?: string }>();
  const poolsQuery = usePools();
  const { setSelectedPair } = useSelectedPair();

  const selectedPool = createMemo(() => {
    const pools = poolsQuery.data;
    if (!pools || pools.length === 0) return null;

    const poolId = params.poolId;
    if (poolId) {
      return pools.find((p) => p.pool_id === poolId);
    }

    return pools.find((p) => p.pool_id === DEFAULT_POOL_ID) || pools[0];
  });

  createEffect(() => {
    const pool = selectedPool();
    if (!pool) return;

    if (!params.poolId) {
      navigate(`/trade/${pool.pool_id}`, { replace: true });
    }
  });

  createEffect(() => {
    const pools = poolsQuery.data;
    const poolId = params.poolId;

    if (!pools || pools.length === 0) return;
    if (!poolId) return;

    const pool = pools.find((p) => p.pool_id === poolId);
    if (!pool) {
      navigate(`/trade/${DEFAULT_POOL_ID}`, { replace: true });
    }
  });

  createEffect(() => {
    const pool = selectedPool();
    if (pool) {
      setSelectedPair({
        poolId: pool.pool_id,
        poolName: pool.pool_name,
        baseCurrency: pool.base_asset_symbol,
        quoteCurrency: pool.quote_asset_symbol,
        baseAssetId: pool.base_asset_id,
        quoteAssetId: pool.quote_asset_id,
        lastPrice: 0,
        priceChange24h: 0,
        quoteVolume: 0,
      });
    }
  });

  return (
    <SidebarProvider>
      <Show
        when={!poolsQuery.isLoading}
        fallback={
          <div class="flex h-screen w-full items-center justify-center">
            <p class="text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <Show
          when={selectedPool()}
          fallback={
            <div class="flex h-screen w-full items-center justify-center">
              <p class="text-muted-foreground">Pool not found</p>
            </div>
          }
        >
          {(pool) => (
            <PoolProvider pool={pool()}>
              <div class="flex h-screen w-full">
                <PairTable />
                <div class="flex flex-1 flex-col overflow-hidden">
                  <Nav />
                  <main class="flex-1 overflow-auto">
                    <Suspense>{props.children}</Suspense>
                  </main>
                </div>
              </div>
            </PoolProvider>
          )}
        </Show>
      </Show>
    </SidebarProvider>
  );
}
