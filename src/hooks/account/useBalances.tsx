import {
  useCurrentAccount,
  useCurrentNetwork,
  useSuiClient,
} from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";
import { useBalanceManager } from "@/contexts/balance-manager";
import {
  mainnetCoins,
  testnetCoins,
  type Coin,
  type CoinMap,
} from "@/constants/deepbook";

import { normalizeStructTag } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/solid-query";

export function useBalances() {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();
  const suiClient = useSuiClient();

  return useQuery(() => ({
    queryKey: ["walletBalances", network(), account()?.address],
    queryFn: async () => {
      return await suiClient().getAllBalances({
        owner: account()!.address,
      });
    },
    enabled: !!account(),
  }));
}

export function useBalance(
  assetType: string | (() => string),
  scalar: number | (() => number)
) {
  const network = useCurrentNetwork();
  const balancesQuery = useBalances();

  const getAssetType =
    typeof assetType === "function" ? assetType : () => assetType;
  const getScalar = typeof scalar === "function" ? scalar : () => scalar;

  return useQuery(() => ({
    queryKey: ["walletBalance", network(), getAssetType()],
    queryFn: () => {
      const balancesArray = [...balancesQuery.data!];

      const rawWalletBalance = balancesArray.find(
        (coin: any) =>
          normalizeStructTag(coin.coinType) ===
          normalizeStructTag(getAssetType())
      )?.totalBalance;

      return rawWalletBalance !== undefined
        ? parseInt(rawWalletBalance) / getScalar()
        : 0;
    },
    enabled: balancesQuery.data !== undefined,
  }));
}

type BalanceManagerBalance = {
  coinType: string;
  balance: number;
};

export function useManagerBalance(coinKey: string | (() => string)) {
  const network = useCurrentNetwork();
  const suiClient = useSuiClient();
  const { balanceManagerAddress } = useBalanceManager();
  const getCoinKey = typeof coinKey === "function" ? coinKey : () => coinKey;

  const coins = (): CoinMap =>
    network() === "mainnet" ? mainnetCoins : testnetCoins;

  return useQuery(() => ({
    queryKey: [
      "managerBalance",
      network(),
      getCoinKey(),
      balanceManagerAddress(),
    ],
    queryFn: async (): Promise<BalanceManagerBalance> => {
      const bmAddress = balanceManagerAddress();
      const coinKeyValue = getCoinKey();

      const coin: Coin | undefined = coins()[coinKeyValue];
      if (!coin) {
        return { coinType: "", balance: 0 };
      }

      const managerObject = await suiClient().getObject({
        id: bmAddress!,
        options: { showContent: true },
      });

      if (managerObject.data?.content?.dataType !== "moveObject") {
        return { coinType: coin.type, balance: 0 };
      }

      const fields = managerObject.data.content.fields as any;
      const bagId = fields?.balances?.fields?.id?.id;

      if (!bagId) {
        return { coinType: coin.type, balance: 0 };
      }

      const dynamicFields = await suiClient().getDynamicFields({
        parentId: bagId,
      });

      const balanceField = dynamicFields.data.find((field: any) => {
        const fieldType = field.name?.type;
        if (fieldType && fieldType.includes("BalanceKey<")) {
          const typeArg = fieldType.match(/BalanceKey<(.+)>/)?.[1];
          if (typeArg) {
            return (
              normalizeStructTag(typeArg) === normalizeStructTag(coin.type)
            );
          }
        }
        return false;
      });

      if (!balanceField) {
        return { coinType: coin.type, balance: 0 };
      }

      const fieldObject = await suiClient().getObject({
        id: balanceField.objectId,
        options: { showContent: true },
      });

      if (fieldObject.data?.content?.dataType === "moveObject") {
        const fieldData = fieldObject.data.content.fields as any;
        const rawBalance = fieldData?.value;
        if (rawBalance) {
          return {
            coinType: coin.type,
            balance: Number(rawBalance) / coin.scalar,
          };
        }
      }

      return { coinType: coin.type, balance: 0 };
    },
    enabled: getCoinKey().length > 0 && !!balanceManagerAddress(),
  }));
}

export function useBalancesFromCurrentPool() {
  const { pool } = useCurrentPool();
  const balancesQuery = useBalances();

  const getAssetBalance = (assetId: string) => {
    const walletBalances = balancesQuery.data;
    if (!walletBalances) return 0;
    const balancesArray = [...walletBalances];
    return parseInt(
      balancesArray.find(
        (coin: any) =>
          normalizeStructTag(coin.coinType) === normalizeStructTag(assetId)
      )?.totalBalance ?? "0"
    );
  };

  const baseAssetBalance = () =>
    getAssetBalance(pool().base_asset_id) / 10 ** pool().base_asset_decimals;
  const quoteAssetBalance = () =>
    getAssetBalance(pool().quote_asset_id) / 10 ** pool().quote_asset_decimals;
  const isLoading = () => balancesQuery.isLoading;

  return { baseAssetBalance, quoteAssetBalance, isLoading };
}
