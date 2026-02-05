import { useQuery } from "@tanstack/solid-query";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSuiClient,
} from "@/contexts/dapp-kit";
import { useDeepBookAccessor } from "@/contexts/deepbook";
import { useBalanceManager } from "@/contexts/balance-manager";
import { getAccount, type AccountInfo } from "@/lib/deepbook-helpers";
import {
  mainnetCoins,
  mainnetPools,
  testnetCoins,
  testnetPools,
  type CoinMap,
  type PoolMap,
} from "@/constants/deepbook";

export function useDeepBookAccount(poolKey: string) {
  const network = useCurrentNetwork();
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const getDbClient = useDeepBookAccessor();
  const { balanceManagerAddress } = useBalanceManager();

  const coins = (): CoinMap =>
    network() === "mainnet" ? mainnetCoins : testnetCoins;
  const pools = (): PoolMap =>
    network() === "mainnet" ? mainnetPools : testnetPools;

  return useQuery(() => ({
    queryKey: [
      "account",
      network(),
      poolKey,
      "MANAGER",
      balanceManagerAddress(),
    ],
    queryFn: async (): Promise<AccountInfo | null> => {
      const senderAddress = account()?.address;
      if (!senderAddress) {
        throw new Error("No account connected");
      }

      const pool = pools()[poolKey];
      if (!pool) {
        throw new Error(`Pool not found: ${poolKey}`);
      }

      const baseCoin = coins()[pool.baseCoin];
      const quoteCoin = coins()[pool.quoteCoin];

      if (!baseCoin || !quoteCoin) {
        throw new Error(`Coins not found for pool: ${poolKey}`);
      }

      return await getAccount(
        suiClient(),
        getDbClient(),
        poolKey,
        senderAddress,
        baseCoin.scalar,
        quoteCoin.scalar
      );
    },
    enabled:
      poolKey.length > 0 && !!balanceManagerAddress() && !!account()?.address,
    retry: false,
  }));
}
