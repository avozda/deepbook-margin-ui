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
import { useCurrentAccount } from "@/contexts/dapp-kit";

type BalanceManagerContextValue = {
  balanceManagerKey: () => string;
  balanceManagerAddress: () => string | undefined;
  setBalanceManager: (address: string) => void;
};

const BalanceManagerContext = createContext<BalanceManagerContextValue>();

export function BalanceManagerProvider(props: { children: JSX.Element }) {
  const account = useCurrentAccount();

  const balanceManagerKey = createMemo(() => {
    const addr = account();
    return addr?.address ? `deepbookui:${addr.address}` : "";
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
}

export function useBalanceManager(): BalanceManagerContextValue {
  const context = useContext(BalanceManagerContext);
  if (!context) {
    throw new Error(
      "useBalanceManager must be used within a BalanceManagerProvider"
    );
  }
  return context;
}
