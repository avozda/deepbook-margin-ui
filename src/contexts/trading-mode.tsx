import {
  createContext,
  useContext,
  createSignal,
  type JSX,
  type Accessor,
} from "solid-js";

export type TradingMode = "spot" | "margin";

type TradingModeContextValue = {
  tradingMode: Accessor<TradingMode>;
  setTradingMode: (mode: TradingMode) => void;
};

const STORAGE_KEY = "deepbook:trading-mode";

const TradingModeContext = createContext<TradingModeContextValue>();

const loadTradingMode = (): TradingMode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "spot" || stored === "margin") return stored;
  return "spot";
};

export const TradingModeProvider = (props: { children: JSX.Element }) => {
  const [tradingMode, setTradingModeSignal] =
    createSignal<TradingMode>(loadTradingMode());

  const setTradingMode = (mode: TradingMode) => {
    setTradingModeSignal(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <TradingModeContext.Provider value={{ tradingMode, setTradingMode }}>
      {props.children}
    </TradingModeContext.Provider>
  );
};

export const useTradingMode = (): TradingModeContextValue => {
  const context = useContext(TradingModeContext);
  if (!context) {
    throw new Error("useTradingMode must be used within a TradingModeProvider");
  }
  return context;
};
