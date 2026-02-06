import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  createMemo,
  type JSX,
  type Accessor,
} from "solid-js";
import { isServer } from "solid-js/web";
import { useCurrentAccount, useCurrentNetwork } from "@/contexts/dapp-kit";
import type { MarginManager } from "@mysten/deepbook-v3";

type MarginManagerData = {
  address: string;
  poolKey: string;
};

type MarginManagersMap = {
  [poolKey: string]: MarginManagerData;
};

type MarginManagerContextValue = {
  marginManagerAddress: Accessor<string | null>;
  marginManagerKey: Accessor<string>;
  poolKey: Accessor<string | null>;
  setMarginManager: (address: string, poolKey: string) => void;
  clearMarginManager: (poolKey: string) => void;
  getMarginManagers: () => { [key: string]: MarginManager };
  hasMarginManager: Accessor<boolean>;
  hasMarginManagerForPool: (poolKey: string) => boolean;
  setCurrentPoolKey: (poolKey: string) => void;
  currentPoolKey: Accessor<string | null>;
};

const STORAGE_KEY_PREFIX = "deepbook-margin-managers";

const MarginManagerContext = createContext<MarginManagerContextValue>();

const getStorageKey = (network: string, address: string): string => {
  return `${STORAGE_KEY_PREFIX}-${network}-${address}`;
};

const loadFromStorage = (
  network: string,
  address: string
): MarginManagersMap => {
  if (isServer) return {};

  const key = getStorageKey(network, address);
  const stored = localStorage.getItem(key);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as MarginManagersMap;
  } catch {
    return {};
  }
};

const saveToStorage = (
  network: string,
  address: string,
  data: MarginManagersMap
): void => {
  if (isServer) return;

  const key = getStorageKey(network, address);
  localStorage.setItem(key, JSON.stringify(data));
};

export const MarginManagerProvider = (props: { children: JSX.Element }) => {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();

  const [marginManagers, setMarginManagers] = createSignal<MarginManagersMap>(
    {}
  );
  const [currentPoolKey, setCurrentPoolKey] = createSignal<string | null>(null);

  createEffect(() => {
    const addr = account()?.address;
    const net = network();

    if (!addr || !net) {
      setMarginManagers({});
      return;
    }

    const data = loadFromStorage(net, addr);
    setMarginManagers(data);
  });

  const currentMarginManager = createMemo(() => {
    const poolKey = currentPoolKey();
    if (!poolKey) return null;
    return marginManagers()[poolKey] ?? null;
  });

  const marginManagerAddress = () => currentMarginManager()?.address ?? null;
  const poolKey = () => currentMarginManager()?.poolKey ?? null;

  const marginManagerKey = createMemo(() => {
    const poolKey = currentPoolKey();
    if (!poolKey) return "MARGIN_MANAGER";
    return `MARGIN_${poolKey}`;
  });

  const hasMarginManager = createMemo(() => currentMarginManager() !== null);

  const hasMarginManagerForPool = (poolKey: string): boolean => {
    return marginManagers()[poolKey] !== undefined;
  };

  const setMarginManager = (address: string, poolKey: string) => {
    const addr = account()?.address;
    const net = network();

    if (!addr || !net) {
      console.warn("Cannot set margin manager: no account or network");
      return;
    }

    const data: MarginManagerData = { address, poolKey };
    const updated = { ...marginManagers(), [poolKey]: data };
    saveToStorage(net, addr, updated);
    setMarginManagers(updated);
  };

  const clearMarginManager = (poolKey: string) => {
    const addr = account()?.address;
    const net = network();

    if (!addr || !net) return;

    const updated = { ...marginManagers() };
    delete updated[poolKey];
    saveToStorage(net, addr, updated);
    setMarginManagers(updated);
  };

  const getMarginManagers = (): { [key: string]: MarginManager } => {
    const managers = marginManagers();
    const result: { [key: string]: MarginManager } = {};

    for (const [poolKey, data] of Object.entries(managers)) {
      result[`MARGIN_${poolKey}`] = {
        address: data.address,
        poolKey: data.poolKey,
      };
    }

    return result;
  };

  return (
    <MarginManagerContext.Provider
      value={{
        marginManagerAddress,
        marginManagerKey,
        poolKey,
        setMarginManager,
        clearMarginManager,
        getMarginManagers,
        hasMarginManager,
        hasMarginManagerForPool,
        setCurrentPoolKey,
        currentPoolKey,
      }}
    >
      {props.children}
    </MarginManagerContext.Provider>
  );
};

export const useMarginManager = (): MarginManagerContextValue => {
  const context = useContext(MarginManagerContext);
  if (!context) {
    throw new Error(
      "useMarginManager must be used within a MarginManagerProvider"
    );
  }
  return context;
};
