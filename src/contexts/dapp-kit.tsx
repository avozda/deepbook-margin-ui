import {
  createContext,
  useContext,
  createSignal,
  onCleanup,
  createMemo,
  JSX,
} from "solid-js";
import type { DAppKit } from "@mysten/dapp-kit-core";
import type { ReadableAtom } from "nanostores";

function useStore<T>(store: ReadableAtom<T>): () => T {
  const [value, setValue] = createSignal<T>(store.get());

  const unsubscribe = store.subscribe((newValue) => {
    setValue(() => newValue);
  });

  onCleanup(() => {
    unsubscribe();
  });

  return value as () => T;
}

type DAppKitContextValue = DAppKit<any, any>;

const DAppKitContext = createContext<DAppKitContextValue>();

export function DAppKitProvider(props: {
  dAppKit: DAppKit<any, any>;
  children: JSX.Element;
}) {
  return (
    <DAppKitContext.Provider value={props.dAppKit}>
      {props.children}
    </DAppKitContext.Provider>
  );
}

export function useDAppKit(): DAppKitContextValue {
  const context = useContext(DAppKitContext);
  if (!context) {
    throw new Error("useDAppKit must be used within a DAppKitProvider");
  }
  return context;
}

export function useSuiClient() {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$currentClient);
}

export function useCurrentNetwork() {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$currentNetwork);
}

export function useWalletConnection() {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$connection);
}

export function useCurrentAccount() {
  const connection = useWalletConnection();
  return createMemo(() => connection().account);
}

export function useCurrentWallet() {
  const connection = useWalletConnection();
  return createMemo(() => ({
    wallet: connection().wallet,
    isConnected: connection().isConnected,
    isConnecting: connection().isConnecting,
    isReconnecting: connection().isReconnecting,
    isDisconnected: connection().isDisconnected,
  }));
}

export function useWallets() {
  const dAppKit = useDAppKit();
  return useStore(dAppKit.stores.$wallets);
}

export function useConnectWallet() {
  const dAppKit = useDAppKit();
  return dAppKit.connectWallet;
}

export function useDisconnectWallet() {
  const dAppKit = useDAppKit();
  return dAppKit.disconnectWallet;
}

export function useSwitchAccount() {
  const dAppKit = useDAppKit();
  return dAppKit.switchAccount;
}

export function useSwitchNetwork() {
  const dAppKit = useDAppKit();
  return dAppKit.switchNetwork;
}

export function useSignTransaction() {
  const dAppKit = useDAppKit();
  return dAppKit.signTransaction;
}

export function useSignAndExecuteTransaction() {
  const dAppKit = useDAppKit();
  return dAppKit.signAndExecuteTransaction;
}

export function useSignPersonalMessage() {
  const dAppKit = useDAppKit();
  return dAppKit.signPersonalMessage;
}
