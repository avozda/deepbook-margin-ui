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

const TradingModeContext = createContext<TradingModeContextValue>();

export const TradingModeProvider = (props: { children: JSX.Element }) => {
  const [tradingMode, setTradingMode] = createSignal<TradingMode>("spot");

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
