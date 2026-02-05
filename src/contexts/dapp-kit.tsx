import {
  createContext,
  useContext,
  createSignal,
  onCleanup,
  onMount,
  createMemo,
  JSX,
} from "solid-js";
import { isServer } from "solid-js/web";
import type { DAppKit } from "@mysten/dapp-kit-core";
import type { ReadableAtom } from "nanostores";

const NETWORK_STORAGE_KEY = "deepbookui:network";

const useStore = <T,>(store: ReadableAtom<T>): (() => T) => {
  const [value, setValue] = createSignal<T>(store.get());

  const unsubscribe = store.subscribe((newValue) => {
    setValue(() => newValue);
  });

  onCleanup(() => {
    unsubscribe();
  });

  return value as () => T;
};

type DAppKitContextValue = DAppKit<any, any>;

const DAppKitContext = createContext<DAppKitContextValue>();

export const DAppKitProvider = (props: {
  dAppKit: DAppKit<any, any>;
  children: JSX.Element;
}) => {
  // eslint-disable-next-line solid/reactivity
  const value = props.dAppKit;

  onMount(() => {
    if (isServer) return;
    const savedNetwork = localStorage.getItem(NETWORK_STORAGE_KEY);
    if (savedNetwork === "mainnet" || savedNetwork === "testnet") {
      value.switchNetwork(savedNetwork);
    }
  });

  return (
    <DAppKitContext.Provider value={value}>
      {props.children}
    </DAppKitContext.Provider>
  );
};

export const useDAppKit = (): DAppKitContextValue => {
  const context = useContext(DAppKitContext);
  if (!context) {
    throw new Error("useDAppKit must be used within a DAppKitProvider");
  }
  return context;
};

export const useSuiClient = () => {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$currentClient);
};

export const useCurrentNetwork = () => {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$currentNetwork);
};

export const useWalletConnection = () => {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$connection);
};

export const useCurrentAccount = () => {
  const connection = useWalletConnection();
  const account = createMemo(() => connection().account);
  return account;
};

export const useCurrentWallet = () => {
  const connection = useWalletConnection();
  const wallet = createMemo(() => ({
    wallet: connection().wallet,
    isConnected: connection().isConnected,
    isConnecting: connection().isConnecting,
    isReconnecting: connection().isReconnecting,
    isDisconnected: connection().isDisconnected,
  }));
  return wallet;
};

export const useWallets = () => {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$wallets);
};

export const useConnectWallet = () => {
  const dAppKit = useDAppKit();
  return dAppKit.connectWallet;
};

export const useDisconnectWallet = () => {
  const dAppKit = useDAppKit();
  return dAppKit.disconnectWallet;
};

export const useSwitchAccount = () => {
  const dAppKit = useDAppKit();
  return dAppKit.switchAccount;
};

export const useSwitchNetwork = () => {
  const dAppKit = useDAppKit();
  return (network: "mainnet" | "testnet") => {
    if (!isServer) {
      localStorage.setItem(NETWORK_STORAGE_KEY, network);
    }
    return dAppKit.switchNetwork(network);
  };
};

export const useSignTransaction = () => {
  const dAppKit = useDAppKit();
  return dAppKit.signTransaction;
};

export const useSignAndExecuteTransaction = () => {
  const dAppKit = useDAppKit();
  return dAppKit.signAndExecuteTransaction;
};

export const useSignPersonalMessage = () => {
  const dAppKit = useDAppKit();
  return dAppKit.signPersonalMessage;
};
