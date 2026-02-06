import { Chart } from "@/components/trade/chart";
import { MarketData } from "@/components/trade/market-data/market-data";
import { TradingPanel } from "@/components/trade/trading-panel/trading-panel";
import { UserOrders } from "@/components/trade/user-orders/user-orders";
import { TradingModeProvider } from "@/contexts/trading-mode";

export default function Trade() {
  return (
    <TradingModeProvider>
      <main class="flex h-full w-full flex-col overflow-hidden">
        <div class="min-h-0 flex-1 overflow-hidden">
          <div class="grid h-full grid-cols-1 grid-rows-[400px_400px_1fr_auto] md:grid-cols-[minmax(0,1fr)_270px_270px] md:grid-rows-[max(60vh,400px)_minmax(0,1fr)]">
            <div class="col-span-1 md:col-start-1 md:col-end-2">
              <Chart />
            </div>
            <div class="col-span-1 border-l md:col-start-2 md:col-end-3">
              <MarketData />
            </div>
            <div class="col-span-1 border-l md:col-start-3 md:col-end-4 md:row-start-1 md:row-end-3">
              <TradingPanel />
            </div>
            <div class="col-span-1 overflow-hidden border-t md:col-start-1 md:col-end-3">
              <UserOrders />
            </div>
          </div>
        </div>
      </main>
    </TradingModeProvider>
  );
}
