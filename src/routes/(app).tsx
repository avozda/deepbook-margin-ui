import {
  Suspense,
  Show,
  ErrorBoundary,
  createMemo,
  createEffect,
  type ParentProps,
} from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Nav } from "@/components/Header/Nav";
import {
  PairTable,
  PairTableTrigger,
  useSelectedPair,
} from "@/components/Header/pair-table";
import { ConnectButton } from "@/components/Header/connect-button";
import { Settings } from "@/components/Header/Settings";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PoolProvider } from "@/contexts/pool";
import { usePools } from "@/hooks/market/usePools";

const NavShell = () => (
  <div class="flex w-full items-center justify-between border-b p-4">
    <div class="flex items-center gap-4 md:gap-8">
      <PairTableTrigger />
    </div>
    <div class="flex items-center gap-4">
      <Settings />
      <ConnectButton connectText="Connect" />
    </div>
  </div>
);

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
      const firstPool = pools[0];
      navigate(`/trade/${firstPool.pool_id}`, { replace: true });
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

  const isLoading = () => poolsQuery.isLoading || !selectedPool();

  return (
    <SidebarProvider>
      <div class="flex h-screen w-full">
        <PairTable />
        <div class="flex flex-1 flex-col overflow-hidden">
          <Show
            when={!isLoading()}
            fallback={
              <>
                <NavShell />
                <div class="flex flex-1 items-center justify-center">
                  <div class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              </>
            }
          >
            <Show when={selectedPool()}>
              {(pool) => (
                <PoolProvider pool={pool()}>
                  <Nav />
                  <main class="min-h-0 flex-1 overflow-hidden">
                    <ErrorBoundary
                      fallback={(err, reset) => (
                        <div class="flex h-full w-full flex-col items-center justify-center gap-4">
                          <p class="text-muted-foreground text-sm">
                            Something went wrong
                          </p>
                          <button
                            class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
                            onClick={reset}
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    >
                      <Suspense
                        fallback={
                          <div class="flex h-full w-full items-center justify-center">
                            <div class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                          </div>
                        }
                      >
                        {props.children}
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                </PoolProvider>
              )}
            </Show>
          </Show>
        </div>
      </div>
    </SidebarProvider>
  );
}
