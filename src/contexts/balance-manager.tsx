import {
  createContext,
  useContext,
  createSignal,
  createMemo,
  createEffect,
  onMount,
  onCleanup,
  JSX,
} from "solid-js";
import { useQuery } from "@tanstack/solid-query";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSuiClient,
} from "@/contexts/dapp-kit";

const BALANCE_MANAGER_EVENT_TYPES = {
  mainnet:
    "0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497::balance_manager::BalanceManagerEvent",
  testnet:
    "0x984757fc7c0e6dd5f15c2c66e881dd6e5aca98b725f3dbd83c445e057ebb790a::balance_manager::BalanceManagerEvent",
};

type BalanceManagerEvent = {
  balance_manager_id: string;
  owner: string;
};

type BalanceManagerContextValue = {
  balanceManagerKey: () => string;
  balanceManagerAddress: () => string | undefined;
  setBalanceManager: (address: string) => void;
};

const BalanceManagerContext = createContext<BalanceManagerContextValue>();

export const BalanceManagerProvider = (props: { children: JSX.Element }) => {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();

  const balanceManagerKey = createMemo(() => {
    const addr = account();
    const net = network();
    return addr?.address ? `deepbookui:${net}:${addr.address}` : "";
  });

  const [balanceManagerAddress, setBalanceManagerAddress] = createSignal<
    string | undefined
  >(undefined);

  let isClient = false;
  onMount(() => {
    isClient = true;
  });

  createEffect(() => {
    const key = balanceManagerKey();
    if (!isClient) return;

    if (!key) {
      setBalanceManagerAddress(undefined);
      return;
    }

    setBalanceManagerAddress(localStorage.getItem(key) ?? undefined);
  });

  onMount(() => {
    const handleStorageChange = () => {
      const key = balanceManagerKey();
      if (!key) return;
      setBalanceManagerAddress(localStorage.getItem(key) ?? undefined);
    };

    window.addEventListener("storage", handleStorageChange);
    onCleanup(() => window.removeEventListener("storage", handleStorageChange));
  });

  const setBalanceManager = (address: string) => {
    const key = balanceManagerKey();
    if (!key) return;

    localStorage.setItem(key, address);
    setBalanceManagerAddress(address);
  };

  const value: BalanceManagerContextValue = {
    balanceManagerKey,
    balanceManagerAddress,
    setBalanceManager,
  };

  return (
    <BalanceManagerContext.Provider value={value}>
      {props.children}
    </BalanceManagerContext.Provider>
  );
};

export const useBalanceManager = (): BalanceManagerContextValue => {
  const context = useContext(BalanceManagerContext);
  if (!context) {
    throw new Error(
      "useBalanceManager must be used within a BalanceManagerProvider"
    );
  }
  return context;
};

export function useBalanceManagerIds() {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();
  const suiClient = useSuiClient();

  return useQuery(() => ({
    queryKey: ["balanceManagerIds", network(), account()?.address],
    queryFn: async (): Promise<string[]> => {
      const address = account()?.address;
      if (!address) return [];

      const eventType =
        network() === "mainnet"
          ? BALANCE_MANAGER_EVENT_TYPES.mainnet
          : BALANCE_MANAGER_EVENT_TYPES.testnet;

      const events = await suiClient().queryEvents({
        query: {
          MoveEventType: eventType,
        },
        order: "descending",
      });

      const balanceManagerIds = events.data
        .filter((event: { parsedJson?: unknown }) => {
          const parsed = event.parsedJson as BalanceManagerEvent | undefined;
          return parsed?.owner === address;
        })
        .map((event: { parsedJson?: unknown }) => {
          const parsed = event.parsedJson as BalanceManagerEvent;
          return parsed.balance_manager_id;
        });

      return Array.from(new Set(balanceManagerIds));
    },
    enabled: !!account()?.address,
  }));
}
