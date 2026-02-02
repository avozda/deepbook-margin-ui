import { createContext, useContext, createMemo, JSX } from "solid-js";
import { DeepBookClient } from "@mysten/deepbook-v3";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSuiClient,
} from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import {
  mainnetCoins,
  testnetCoins,
  mainnetPools,
  testnetPools,
} from "@/constants/deepbook";

const DeepBookContext = createContext<() => DeepBookClient>();

export const DeepBookProvider = (props: { children: JSX.Element }) => {
  const client = useSuiClient();
  const network = useCurrentNetwork();
  const account = useCurrentAccount();
  const { balanceManagerAddress } = useBalanceManager();

  const deepBookClient = createMemo(() => {
    const net = network();
    const addr = account()?.address ?? "";
    const bmAddress = balanceManagerAddress();

    return new DeepBookClient({
      client: client(),
      network: net,
      address: addr,
      balanceManagers: bmAddress
        ? {
            MANAGER: {
              address: bmAddress,
              tradeCap: undefined,
            },
          }
        : {},
      coins: net === "mainnet" ? mainnetCoins : testnetCoins,
      pools: net === "mainnet" ? mainnetPools : testnetPools,
    });
  });

  return (
    <DeepBookContext.Provider value={deepBookClient}>
      {props.children}
    </DeepBookContext.Provider>
  );
};

export const useDeepBook = (): DeepBookClient => {
  const context = useContext(DeepBookContext);
  if (!context) {
    throw new Error("useDeepBook must be used within a DeepBookProvider");
  }
  return context();
};

export const useDeepBookAccessor = (): (() => DeepBookClient) => {
  const context = useContext(DeepBookContext);
  if (!context) {
    throw new Error(
      "useDeepBookAccessor must be used within a DeepBookProvider"
    );
  }
  return context;
};
