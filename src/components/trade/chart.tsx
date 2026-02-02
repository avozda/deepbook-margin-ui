import { onMount, onCleanup, createEffect } from "solid-js";
import { useColorMode } from "@kobalte/core";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useCandleData } from "@/hooks/market/useCandleData";

export const Chart = () => {
  const { colorMode } = useColorMode();
  const candlesQuery = useCandleData();
  let containerRef: HTMLDivElement | undefined;
  let chartInstance: IChartApi | null = null;
  let candlestickSeries: any = null;

  const formatCandles = (
    data: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[]
  ) => {
    return data.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
  };

  onMount(() => {
    if (!containerRef) return;

    chartInstance = createChart(containerRef, {
      autoSize: true,
      leftPriceScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderColor:
          colorMode() === "dark"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
      },
      crosshair: {
        mode: 0,
        vertLine: {
          labelBackgroundColor: "#a3a3a3",
        },
        horzLine: {
          labelBackgroundColor: "#a3a3a3",
        },
      },
      layout: {
        background: {
          color:
            colorMode() === "dark" ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 100%)",
        },
        textColor: colorMode() === "dark" ? "#ffffff" : "#000000",
      },
      grid: {
        vertLines: {
          color:
            colorMode() === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
        horzLines: {
          color:
            colorMode() === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
        },
      },
    });

    candlestickSeries = chartInstance.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceFormat: {
        type: "price",
        precision: 4,
        minMove: 0.0001,
      },
    });

    if (candlesQuery.data) {
      candlestickSeries.setData(formatCandles(candlesQuery.data));
      chartInstance.timeScale().fitContent();
    }

    onCleanup(() => {
      if (chartInstance) {
        chartInstance.remove();
        chartInstance = null;
        candlestickSeries = null;
      }
    });
  });

  createEffect(() => {
    if (!chartInstance || !candlestickSeries) return;

    const candles = candlesQuery.data;
    if (candles) {
      candlestickSeries.setData(formatCandles(candles));
      chartInstance.timeScale().fitContent();
    }
  });

  createEffect(() => {
    if (!chartInstance) return;

    const isDark = colorMode() === "dark";
    chartInstance.applyOptions({
      timeScale: {
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      },
      layout: {
        background: {
          color: isDark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 100%)",
        },
        textColor: isDark ? "#ffffff" : "#000000",
      },
      grid: {
        vertLines: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        horzLines: {
          color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
    });
  });

  return <div ref={containerRef} class="flex h-full w-full cursor-crosshair" />;
};
