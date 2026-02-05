import { createSignal, createMemo, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Search, Loader } from "lucide-solid";
import {
  Sidebar,
  SidebarContent,
  SidebarOverlay,
  useSidebar,
} from "@/components/ui/sidebar";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { usePools, type Pool } from "@/hooks/market/usePools";
import { useSummary, type Pair } from "@/hooks/market/useSummary";
import { formatVolume, formatPrice } from "@/lib/utils";

import suiImg from "@/assets/sui.png";
import usdcImg from "@/assets/usdc.png";
import usdtImg from "@/assets/usdt.png";
import deepImg from "@/assets/deep.png";

const COIN_IMAGES: Record<string, string> = {
  SUI: suiImg,
  USDC: usdcImg,
  USDT: usdtImg,
  DEEP: deepImg,
  WUSDC: usdcImg,
  WUSDT: usdtImg,
  DBUSDC: usdcImg,
  DBUSDT: usdtImg,
};

const getCoinImage = (currency: string): string | null => {
  const normalized = currency.toUpperCase();
  return COIN_IMAGES[normalized] || null;
};

type CoinIconProps = {
  currency: string;
  class?: string;
  zIndex?: number;
};

const CoinIcon = (props: CoinIconProps) => {
  const image = () => getCoinImage(props.currency);

  return (
    <Show
      when={image()}
      fallback={
        <div
          class={`bg-muted flex items-center justify-center rounded-full text-[10px] font-bold ${props.class || "size-6"}`}
          style={{ "z-index": props.zIndex }}
        >
          {props.currency.slice(0, 2)}
        </div>
      }
    >
      <img
        src={image()!}
        alt={`${props.currency} icon`}
        class={`rounded-full ${props.class || "size-6"}`}
        style={{ "z-index": props.zIndex }}
      />
    </Show>
  );
};

export type PairData = {
  poolId: string;
  poolName: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseAssetId: string;
  quoteAssetId: string;
  lastPrice: number;
  priceChange24h: number;
  quoteVolume: number;
};

const mergePairData = (
  pools: Pool[] | undefined,
  summary: Pair[] | undefined
): PairData[] => {
  if (!pools || !summary) return [];

  return pools
    .map((pool) => {
      const marketData = summary.find(
        (s) => s.trading_pairs === pool.pool_name
      );

      return {
        poolId: pool.pool_id,
        poolName: pool.pool_name,
        baseCurrency: marketData?.base_currency || pool.base_asset_symbol,
        quoteCurrency: marketData?.quote_currency || pool.quote_asset_symbol,
        baseAssetId: pool.base_asset_id,
        quoteAssetId: pool.quote_asset_id,
        lastPrice: marketData?.last_price || 0,
        priceChange24h: marketData?.price_change_percent_24h || 0,
        quoteVolume: marketData?.quote_volume || 0,
      };
    })
    .sort((a, b) => b.quoteVolume - a.quoteVolume);
};

const [selectedPair, setSelectedPair] = createSignal<PairData | null>(null);

export const useSelectedPair = () => ({
  selectedPair,
  setSelectedPair,
});

export const PairTableTrigger = () => {
  const { toggle } = useSidebar();
  const poolsQuery = usePools();
  const summaryQuery = useSummary();

  const pairs = createMemo(() =>
    mergePairData(poolsQuery.data, summaryQuery.data)
  );

  const currentPair = createMemo(() => {
    const selected = selectedPair();
    if (selected) return selected;
    return pairs()[0] || null;
  });

  const isLoading = () => poolsQuery.isLoading || summaryQuery.isLoading;

  return (
    <button
      class="bg-secondary hover:bg-secondary/80 flex max-w-min items-center justify-center gap-2 rounded-full px-8 py-2 transition-colors"
      onClick={toggle}
    >
      <Show
        when={!isLoading() && currentPair()}
        fallback={
          <Show
            when={isLoading()}
            fallback={<span class="whitespace-nowrap">Select Pair</span>}
          >
            <div class="bg-muted h-5 w-20 animate-pulse rounded" />
          </Show>
        }
      >
        {(pair) => (
          <>
            <div class="flex shrink-0">
              <CoinIcon currency={pair().baseCurrency} zIndex={10} />
              <CoinIcon currency={pair().quoteCurrency} class="-ml-2 size-6" />
            </div>
            <span class="whitespace-nowrap">
              {pair().baseCurrency}-{pair().quoteCurrency}
            </span>
          </>
        )}
      </Show>
    </button>
  );
};

const PairTableContent = () => {
  const [searchQuery, setSearchQuery] = createSignal("");
  const { setExpanded } = useSidebar();
  const navigate = useNavigate();
  const poolsQuery = usePools();
  const summaryQuery = useSummary();

  const pairs = createMemo(() =>
    mergePairData(poolsQuery.data, summaryQuery.data)
  );

  const filteredPairs = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    if (!query) return pairs();

    return pairs().filter(
      (pair) =>
        pair.baseCurrency.toLowerCase().includes(query) ||
        pair.quoteCurrency.toLowerCase().includes(query) ||
        `${pair.baseCurrency}-${pair.quoteCurrency}`
          .toLowerCase()
          .includes(query)
    );
  });

  const handleSelectPair = (pair: PairData) => {
    navigate(`/trade/${pair.poolId}`);
    setExpanded(false);
  };

  const isLoading = () => poolsQuery.isLoading || summaryQuery.isLoading;

  return (
    <div class="flex h-full flex-col p-4 font-mono text-sm">
      <TextField
        value={searchQuery()}
        onChange={setSearchQuery}
        class="relative"
      >
        <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <TextFieldInput placeholder="Search markets..." class="pl-9" />
      </TextField>

      <div class="mt-4 flex-1 divide-y overflow-y-auto">
        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-8">
            <Loader class="text-muted-foreground size-6 animate-spin" />
          </div>
        </Show>

        <Show when={!isLoading() && filteredPairs().length === 0}>
          <p class="text-muted-foreground py-8 text-center">No pairs found</p>
        </Show>

        <Show when={!isLoading() && filteredPairs().length > 0}>
          <For each={filteredPairs()}>
            {(pair) => (
              <button
                class="hover:bg-accent flex w-full items-center gap-4 p-3 text-left transition-colors"
                onClick={() => handleSelectPair(pair)}
              >
                <div class="flex shrink-0">
                  <CoinIcon currency={pair.baseCurrency} zIndex={10} />
                  <CoinIcon
                    currency={pair.quoteCurrency}
                    class="-ml-2 size-6"
                  />
                </div>
                <div class="grid flex-1 grid-cols-2 gap-1">
                  <p class="text-sm font-medium">
                    {pair.baseCurrency}-{pair.quoteCurrency}
                  </p>
                  <p class="text-right text-xs">
                    {formatPrice(pair.lastPrice, pair.quoteCurrency)}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    Vol {formatVolume(pair.quoteVolume)} {pair.quoteCurrency}
                  </p>
                  <p
                    class={`text-right text-xs ${
                      pair.priceChange24h < 0
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {pair.priceChange24h >= 0 ? "+" : ""}
                    {pair.priceChange24h.toFixed(2)}%
                  </p>
                </div>
              </button>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export const PairTable = () => {
  return (
    <>
      <SidebarOverlay />
      <Sidebar class="fixed z-50 md:relative" expandedWidth="320px">
        <SidebarContent class="p-0">
          <PairTableContent />
        </SidebarContent>
      </Sidebar>
    </>
  );
};
