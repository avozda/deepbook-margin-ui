import {
  createContext,
  useContext,
  createMemo,
  type JSX,
  type Accessor,
} from "solid-js";
import type { Pool } from "@/hooks/market/usePools";

function roundToPlace(number: number, precision: number): string {
  if (isNaN(number)) {
    throw new Error("Input must be a valid number");
  }

  if (precision === 0) {
    return Math.round(number).toString();
  }

  if (precision < 0) {
    const scale = Math.pow(10, -precision);
    return (Math.round(number / scale) * scale).toString();
  }

  const scale = Math.pow(10, precision);
  return (Math.round(number * scale) / scale).toString();
}

type PoolContextValue = {
  pool: Accessor<Pool>;
  quotePrecision: Accessor<number>;
  basePrecision: Accessor<number>;
  displayPrecision: Accessor<number>;
  round: {
    quote: (value: number) => string;
    base: (value: number) => string;
    display: (value: number) => string;
  };
};

const PoolContext = createContext<PoolContextValue>();

type PoolProviderProps = {
  pool: Pool;
  children: JSX.Element;
};

export const PoolProvider = (props: PoolProviderProps) => {
  const pool = () => props.pool;

  const quotePrecision = createMemo(() => {
    const p = pool();
    return (
      9 -
      Math.log10(p.tick_size) +
      p.quote_asset_decimals -
      p.base_asset_decimals
    );
  });

  const basePrecision = createMemo(() => {
    const p = pool();
    return p.base_asset_decimals - Math.log10(p.lot_size);
  });

  const displayPrecision = createMemo(() => {
    return Math.max(quotePrecision(), basePrecision());
  });

  const round = {
    quote: (value: number) => roundToPlace(value, quotePrecision()),
    base: (value: number) => roundToPlace(value, basePrecision()),
    display: (value: number) => roundToPlace(value, displayPrecision()),
  };

  const value: PoolContextValue = {
    pool,
    quotePrecision,
    basePrecision,
    displayPrecision,
    round,
  };

  return (
    <PoolContext.Provider value={value}>{props.children}</PoolContext.Provider>
  );
};

export const useCurrentPool = (): PoolContextValue => {
  const context = useContext(PoolContext);

  if (!context) {
    throw new Error("useCurrentPool must be used within PoolProvider");
  }

  return context;
};
