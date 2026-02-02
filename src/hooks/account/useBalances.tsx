import { useCurrentAccount, useSuiClient } from "@/contexts/dapp-kit";
import { useDeepBook } from "@/contexts/deepbook";
import { useCurrentPool } from "@/contexts/pool";

import { normalizeStructTag } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/solid-query";

export function useBalances() {
  const account = useCurrentAccount();
  const dbClient = useSuiClient();

  return useQuery(() => ({
    queryKey: ["walletBalances", account()?.address],
    queryFn: async () => {
      return await dbClient().getAllBalances({
        owner: account()!.address,
      });
    },
    enabled: !!dbClient && !!account,
  }));
}

export function useBalance(
  assetType: string | (() => string),
  scalar: number | (() => number)
) {
  const { data: balances } = useBalances();
  const getAssetType =
    typeof assetType === "function" ? assetType : () => assetType;
  const getScalar = typeof scalar === "function" ? scalar : () => scalar;

  return useQuery(() => ({
    queryKey: ["walletBalance", getAssetType()],
    queryFn: () => {
      const rawWalletBalance = balances!.find(
        (coin: any) =>
          normalizeStructTag(coin.coinType) ===
          normalizeStructTag(getAssetType())
      )?.totalBalance;
      return rawWalletBalance !== undefined
        ? parseInt(rawWalletBalance) / getScalar()
        : 0;
    },
    enabled: balances !== undefined,
  }));
}

export function useManagerBalance(
  managerKey: string | (() => string),
  coinKey: string | (() => string)
) {
  const dbClient = useDeepBook();
  const getManagerKey =
    typeof managerKey === "function" ? managerKey : () => managerKey;
  const getCoinKey = typeof coinKey === "function" ? coinKey : () => coinKey;

  return useQuery(() => ({
    queryKey: ["managerBalance", getManagerKey(), getCoinKey()],
    queryFn: async () =>
      await dbClient?.checkManagerBalance(getManagerKey(), getCoinKey()),
    enabled: !!dbClient && getCoinKey().length > 0,
  }));
}

export function useBalancesFromCurrentPool() {
  const { pool } = useCurrentPool();
  const { data: walletBalances } = useBalances();

  const getAssetBalance = (assetId: string) => {
    return parseInt(
      walletBalances?.find(
        (coin: any) =>
          normalizeStructTag(coin.coinType) === normalizeStructTag(assetId)
      )?.totalBalance ?? "0"
    );
  };

  const baseAssetBalance =
    getAssetBalance(pool().base_asset_id) / 10 ** pool().base_asset_decimals;
  const quoteAssetBalance =
    getAssetBalance(pool().quote_asset_id) / 10 ** pool().quote_asset_decimals;

  return { baseAssetBalance, quoteAssetBalance };
}
