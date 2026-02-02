import { useQuery } from "@tanstack/solid-query";
import { useSuiClient } from "@/contexts/dapp-kit";

export function usePoolAssetMetadata(
  baseCoinType: string,
  quoteCoinType: string
) {
  const suiClient = useSuiClient();

  const baseAssetQuery = useQuery(() => ({
    queryKey: ["coinMetadata", baseCoinType],
    queryFn: async () => {
      return suiClient().getCoinMetadata({
        coinType: baseCoinType,
      });
    },
    enabled: !!baseCoinType,
  }));

  const quoteAssetQuery = useQuery(() => ({
    queryKey: ["coinMetadata", quoteCoinType],
    queryFn: async () => {
      return suiClient().getCoinMetadata({
        coinType: quoteCoinType,
      });
    },
    enabled: !!quoteCoinType,
  }));

  return {
    baseAssetMetadata: baseAssetQuery.data,
    quoteAssetMetadata: quoteAssetQuery.data,
    isLoading: baseAssetQuery.isLoading || quoteAssetQuery.isLoading,
    error: baseAssetQuery.error || quoteAssetQuery.error,
  };
}
