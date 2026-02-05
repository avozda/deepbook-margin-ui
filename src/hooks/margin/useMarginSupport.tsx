import { createMemo } from "solid-js";
import { mainnetMarginPools, testnetMarginPools } from "@mysten/deepbook-v3";
import { useCurrentNetwork } from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";

export function useMarginSupport() {
  const network = useCurrentNetwork();
  const { pool } = useCurrentPool();

  const marginPools = createMemo(() =>
    network() === "mainnet" ? mainnetMarginPools : testnetMarginPools
  );

  const isMarginSupported = createMemo(() => {
    const p = pool();
    const pools = marginPools();

    const baseSymbol = p.base_asset_symbol;
    const quoteSymbol = p.quote_asset_symbol;

    const hasBaseMarginPool = baseSymbol in pools;
    const hasQuoteMarginPool = quoteSymbol in pools;

    return hasBaseMarginPool && hasQuoteMarginPool;
  });

  const unsupportedReason = createMemo(() => {
    if (isMarginSupported()) return null;

    const p = pool();
    const pools = marginPools();

    const baseSymbol = p.base_asset_symbol;
    const quoteSymbol = p.quote_asset_symbol;

    const missingAssets: string[] = [];
    if (!(baseSymbol in pools)) missingAssets.push(baseSymbol);
    if (!(quoteSymbol in pools)) missingAssets.push(quoteSymbol);

    if (missingAssets.length === 2) {
      return `${baseSymbol} and ${quoteSymbol} do not have margin pools`;
    }
    return `${missingAssets[0]} does not have a margin pool`;
  });

  return {
    isMarginSupported,
    unsupportedReason,
  };
}
